import pool, { withTransaction } from "../config/database.js";
import { AppError, throwMissingOrStale } from "../utils/errors.js";
import {
  checkGroup,
  getGroupEmails,
  getUserName,
  parseJson,
} from "../utils/users.js";
import { workspaceChannel } from "../utils/sse.js";
import { sendMail } from "../utils/mailer.js";

// Set to true to email every Project Lead when a task moves to Done.
const EMAIL_LEADS_ON_DONE = false;

// Every allowed Task Board move, "from>to":
//   group - who may make the move
//   owner - "self": the mover becomes the owner; "none": owner is cleared
// Keep in sync with TRANSITIONS in client/src/pages/TaskBoard/TaskBoard.jsx.
const TRANSITIONS = {
  "Open>To Do": { group: "Project Manager" }, // Release Task
  "To Do>Doing": { group: "Developer", owner: "self" }, // Start Task
  "Doing>Done": { group: "Developer" }, // Request Review
  "Doing>To Do": { group: "Developer", owner: "none" }, // Reject Task
  "Done>Closed": { group: "Project Lead" }, // Approve
  "Done>Doing": { group: "Project Lead" }, // Reject
};

// Editing a task's details without moving it ("Define Task").
const EDIT_GROUP = "Project Lead";

// ownerName comes from a JOIN so the client doesn't have to look each
// owner up separately.
const TASK_FIELDS = `
  t.Task_id AS id, t.Task_name AS name, t.Task_description AS description,
  t.Task_plan AS plan, t.Task_app_Acronym AS appAcronym, t.Task_state AS state,
  t.Task_creator AS creatorId, t.Task_owner AS ownerId, owner.name AS ownerName,
  t.Task_createDate AS createDate, t.Task_notes AS notes, t.updated_at AS updatedAt`;

// Task_notes is the task's history: one entry per save or note, never
// overwritten. `from` is set only when the save moved the task, so the
// history can show "Doing -> Done".
const historyEntry = async (userId, state, text, from = null) => ({
  state,
  from,
  changedBy: await getUserName(userId),
  changedAt: new Date().toISOString(),
  text: text?.trim() || null,
});

// GET /api/tasks?appId=...&plan=...
// plan=none returns tasks with no plan; leaving plan out returns every task.
export const getTasks = async (req, res) => {
  const { appId, plan } = req.query;
  if (!appId) {
    throw new AppError(400, "appId is required");
  }

  let sql = `SELECT ${TASK_FIELDS} FROM tasks t
             LEFT JOIN users owner ON owner.user_id = t.Task_owner
             WHERE t.Task_app_Acronym = ?`;
  const params = [appId];
  if (plan === "none") {
    sql += " AND t.Task_plan IS NULL";
  } else if (plan) {
    sql += " AND t.Task_plan = ?";
    params.push(plan);
  }
  // Creation order - Task_id would sort "ABC_10" before "ABC_2".
  sql += " ORDER BY t.Task_createDate";

  const [rows] = await pool.query(sql, params);
  res
    .status(200)
    .json(rows.map((row) => ({ ...row, notes: parseJson(row.notes) })));
};

// POST /api/tasks
export const createTask = async (req, res) => {
  const { name, description, plan, appId, ownerId, notes } = req.body;
  if (!name || !appId) {
    throw new AppError(400, "Name and application are required");
  }

  const history = [await historyEntry(req.user.id, "Open", notes)];

  const taskId = await withTransaction(async (db) => {
    // Task ids are "<acronym>_<App_Rnumber>". FOR UPDATE locks the app row
    // so two tasks created at the same moment can't get the same number.
    const [apps] = await db.query(
      "SELECT App_Rnumber FROM `Application` WHERE App_Acronym = ? FOR UPDATE",
      [appId],
    );
    if (apps.length === 0) {
      throw new AppError(400, "Application not found");
    }
    const number = apps[0].App_Rnumber;
    const id = `${appId}_${number}`;

    await db.query(
      `INSERT INTO tasks (Task_id, Task_name, Task_description, Task_plan, Task_app_Acronym,
                          Task_creator, Task_owner, Task_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        description || null,
        plan || null,
        appId,
        req.user.id,
        ownerId || null,
        JSON.stringify(history),
      ],
    );
    await db.query(
      "UPDATE `Application` SET App_Rnumber = ? WHERE App_Acronym = ?",
      [number + 1, appId],
    );
    return id;
  });

  workspaceChannel.send(appId, "changed");
  res.status(201).json({ message: "Task created", id: taskId });
};

// PUT /api/tasks/:id
// Used both for editing details (state unchanged) and for Task Board moves
// (state changed). Each is permission-checked differently - see TRANSITIONS.
export const updateTask = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    plan,
    state,
    ownerId,
    notes,
    updated_at: updatedAt,
  } = req.body;

  if (!name) {
    throw new AppError(400, "Name is required");
  }
  if (updatedAt === undefined) {
    throw new AppError(400, "Missing updated_at for the task being updated");
  }

  const [rows] = await pool.query(
    "SELECT Task_state, Task_notes, Task_app_Acronym FROM tasks WHERE Task_id = ?",
    [id],
  );
  if (rows.length === 0) {
    throw new AppError(404, "Task not found");
  }
  const fromState = rows[0].Task_state;
  const toState = state || "Open";
  const appId = rows[0].Task_app_Acronym;
  const isMove = fromState !== toState;

  const transition = isMove
    ? TRANSITIONS[`${fromState}>${toState}`]
    : { group: EDIT_GROUP };
  if (!transition) {
    throw new AppError(
      400,
      `Invalid task transition: ${fromState} -> ${toState}`,
    );
  }
  if (!(await checkGroup(req.user.id, transition.group))) {
    throw new AppError(403, `${transition.group} group access required`);
  }
  // A task can be created without a plan, but needs one to be released,
  // and keeps one from then on.
  if (toState !== "Open" && !plan) {
    throw new AppError(
      400,
      fromState === "Open"
        ? "Assign a plan to this task before releasing it"
        : "A released task must have a plan",
    );
  }

  const newOwnerId =
    transition.owner === "self"
      ? req.user.id
      : transition.owner === "none"
        ? null
        : ownerId || null;

  // Only a move or a typed note is worth a history entry - a plain edit
  // would just add an empty row repeating the current state.
  const history = parseJson(rows[0].Task_notes);
  if (isMove || notes?.trim()) {
    history.push(
      await historyEntry(req.user.id, toState, notes, isMove ? fromState : null),
    );
  }

  const [result] = await pool.query(
    `UPDATE tasks
       SET Task_name = ?, Task_description = ?, Task_plan = ?, Task_state = ?,
           Task_owner = ?, Task_notes = ?, updated_at = NOW(6)
     WHERE Task_id = ? AND updated_at <=> ?`,
    [
      name,
      description || null,
      plan || null,
      toState,
      newOwnerId,
      JSON.stringify(history),
      id,
      updatedAt,
    ],
  );
  if (result.affectedRows === 0) {
    await throwMissingOrStale(
      pool,
      "SELECT 1 FROM tasks WHERE Task_id = ?",
      [id],
      "Task",
    );
  }

  if (EMAIL_LEADS_ON_DONE && isMove && toState === "Done") {
    // Not awaited - a slow or failing mail server shouldn't hold up the save.
    emailLeadsTaskDone({
      id,
      name,
      description,
      appId,
      ownerId: newOwnerId,
    }).catch((err) =>
      console.error("Failed to send Done-state notification email:", err),
    );
  }

  workspaceChannel.send(appId, "changed");
  res.status(200).json({ message: "Task updated" });
};

// POST /api/tasks/:id/notes
// Adds a note to the task's history at its current state, without
// changing anything else about the task.
export const addTaskNote = async (req, res) => {
  const { id } = req.params;
  const text = req.body.text?.trim();
  if (!text) {
    throw new AppError(400, "Note cannot be empty");
  }

  const [rows] = await pool.query(
    "SELECT Task_state, Task_app_Acronym FROM tasks WHERE Task_id = ?",
    [id],
  );
  if (rows.length === 0) {
    throw new AppError(404, "Task not found");
  }
  const entry = await historyEntry(req.user.id, rows[0].Task_state, text);

  // JSON_ARRAY_APPEND so a note added at the same moment as another save
  // doesn't overwrite it.
  await pool.query(
    `UPDATE tasks
       SET Task_notes = JSON_ARRAY_APPEND(Task_notes, '$', CAST(? AS JSON)),
           updated_at = NOW(6)
     WHERE Task_id = ?`,
    [JSON.stringify(entry), id],
  );

  workspaceChannel.send(rows[0].Task_app_Acronym, "changed");
  res.status(201).json({ message: "Note added" });
};

// Emails every active Project Lead that a task is ready for review.
const emailLeadsTaskDone = async ({
  id,
  name,
  description,
  appId,
  ownerId,
}) => {
  const leadEmails = await getGroupEmails("Project Lead");
  if (leadEmails.length === 0) return;

  const ownerName = ownerId != null ? await getUserName(ownerId) : "Unassigned";
  await sendMail({
    to: leadEmails.join(", "),
    subject: `[${appId}] ${id} is ready for review`,
    text:
      `Task ${id} - "${name}" (${appId}) has been moved to Done and is awaiting your review.\n\n` +
      `Completed by: ${ownerName}\n` +
      `Completed at: ${new Date().toLocaleString()}\n` +
      `Description: ${description || "(none)"}`,
  });
};
