import pool from "../config/database.js";
import { AppError } from "../utils/errors.js";
import {
  addWorkspaceClient,
  removeWorkspaceClient,
  notifyWorkspaceChanged,
} from "../utils/workspaceSseClients.js";
import { openSseStream } from "../utils/sseHandshake.js";
import { getGroupEmails, checkGroup } from "./groupController.js";
import { sendMail } from "../utils/mailer.js";

const LEAD_GROUP = "Project Lead";
const PM_GROUP = "Project Manager";
const DEV_GROUP = "Developer";

// Which group is allowed to drive each task-board state transition -
// mirrors TRANSITIONS in client/src/pages/TaskBoard/TaskBoard.jsx.
const TRANSITION_ROLES = {
  "Open>To Do": PM_GROUP, // Release Task
  "To Do>Doing": DEV_GROUP, // Start Task
  "Doing>Done": DEV_GROUP, // Request Review
  "Doing>To Do": DEV_GROUP, // Reject/forfeit Task
  "Done>Closed": LEAD_GROUP, // Approve
  "Done>Doing": LEAD_GROUP, // Reject
};

const STALE_UPDATE_ERROR = new AppError(
  409,
  "This task was changed by someone else. Refresh and try again.",
);

// Which transitions force a new owner, overriding whatever ownerId the
// client sent - starting a task claims it, rejecting a Doing task releases
// it back to the pool. Every other transition (and any plain edit) leaves
// Task_owner as the client passed it.
const OWNER_ON_TRANSITION = {
  "To Do>Doing": "assign",
  "Doing>To Do": "unassign",
};

const SELECT_FIELDS =
  "Task_id AS id, Task_name AS name, " +
  "Task_description AS description, " +
  "Task_plan AS plan, Task_app_Acronym AS appAcronym, Task_state AS state, " +
  "Task_creator AS creatorId, Task_owner AS ownerId, " +
  "Task_createDate AS createDate, Task_dueDate AS dueDate, " +
  "Task_notes AS notes, updated_at AS updatedAt";

const formatTask = (row) => ({
  ...row,
  notes: typeof row.notes === "string" ? JSON.parse(row.notes) : row.notes,
});

// Disabled for now - kept working in case it's needed later.
const notifyTaskDone = async ({
  taskRef,
  taskName,
  taskDescription,
  appAcronym,
  ownerName,
  completedAt,
}) => {
  const leadEmails = await getGroupEmails(LEAD_GROUP);
  if (leadEmails.length === 0) return;

  await sendMail({
    to: leadEmails.join(", "),
    subject: `[${appAcronym}] ${taskRef} is ready for review`,
    text:
      `Task ${taskRef} - "${taskName}" (${appAcronym}) has been moved to Done ` +
      `and is awaiting your review.\n\n` +
      `Completed by: ${ownerName ?? "Unassigned"}\n` +
      `Completed at: ${completedAt}\n` +
      `Description: ${taskDescription || "(none)"}`,
  });
};

// GET /api/tasks?appId=...&plan=...
// plan=none returns tasks with no plan; omitting it returns every task.
export const getTasks = async (req, res) => {
  const { appId, plan } = req.query;

  const conditions = [];
  const params = [];
  if (appId) {
    conditions.push("Task_app_Acronym = ?");
    params.push(appId);
  }
  if (plan === "none") {
    conditions.push("Task_plan IS NULL");
  } else if (plan) {
    conditions.push("Task_plan = ?");
    params.push(plan);
  }

  // Not ORDER BY Task_id - it's a display ref string ("ABC_10" sorts before
  // "ABC_2"), not creation order.
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS} FROM tasks ${where} ORDER BY Task_createDate`,
    params,
  );
  res.status(200).json(rows.map(formatTask));
};

// POST /api/tasks
export const createTask = async (req, res) => {
  const { name, description, plan, appId, ownerId, dueDate, notes } =
    req.body;
  if (!name || !appId) {
    throw new AppError(400, "Name and application are required");
  }

  const creatorId = req.user.id;

  const connection = await pool.getConnection();
  let taskId;
  try {
    await connection.beginTransaction();

    // FOR UPDATE so two concurrent creates on the same app can't read and
    // increment the same App_Rnumber, which would hand out the same Task_id.
    const [appRows] = await connection.query(
      "SELECT App_Rnumber FROM `Application` WHERE App_Acronym = ? FOR UPDATE",
      [appId],
    );
    if (appRows.length === 0) {
      throw new AppError(400, "Application not found");
    }
    const runningNumber = appRows[0].App_Rnumber;
    taskId = `${appId}_${runningNumber}`;

    const [creatorRows] = await connection.query(
      "SELECT name FROM users WHERE user_id = ?",
      [creatorId],
    );
    const initialNotes = [
      {
        state: "Open",
        changedBy: creatorRows[0]?.name ?? "Unknown",
        changedAt: new Date().toISOString(),
        text: notes?.trim() || null,
      },
    ];

    await connection.query(
      "INSERT INTO tasks (Task_id, Task_name, Task_description, Task_plan, Task_app_Acronym, Task_creator, Task_owner, Task_dueDate, Task_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        taskId,
        name,
        description || null,
        plan || null,
        appId,
        creatorId,
        ownerId || null,
        dueDate || null,
        JSON.stringify(initialNotes),
      ],
    );

    await connection.query(
      "UPDATE `Application` SET App_Rnumber = ? WHERE App_Acronym = ?",
      [runningNumber + 1, appId],
    );

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  notifyWorkspaceChanged(appId);
  res.status(201).json({ message: "Task created", id: taskId });
};

// PUT /api/tasks/:id
export const updateTask = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    plan,
    state,
    ownerId,
    dueDate,
    notes,
    updated_at: updatedAt,
  } = req.body;

  if (!name) {
    throw new AppError(400, "Name is required");
  }
  if (updatedAt === undefined) {
    throw new AppError(400, "Missing updated_at for the task being updated");
  }

  const [beforeRows] = await pool.query(
    "SELECT Task_state, Task_notes, Task_app_Acronym FROM tasks WHERE Task_id = ?",
    [id],
  );
  if (beforeRows.length === 0) {
    throw new AppError(404, "Task not found");
  }
  const previousState = beforeRows[0].Task_state;
  const appId = beforeRows[0].Task_app_Acronym;
  const nextState = state || "Open";

  // Plain edit (state unchanged) = "Define Task", Project Lead only.
  // Otherwise it's a board transition, gated per TRANSITION_ROLES.
  const requiredGroup =
    nextState === previousState
      ? LEAD_GROUP
      : TRANSITION_ROLES[`${previousState}>${nextState}`];
  if (!requiredGroup) {
    throw new AppError(400, `Invalid task transition: ${previousState} -> ${nextState}`);
  }
  if (!(await checkGroup(req.user.id, requiredGroup))) {
    throw new AppError(403, `${requiredGroup} group access required`);
  }

  const ownerTransition = OWNER_ON_TRANSITION[`${previousState}>${nextState}`];
  const nextOwnerId =
    ownerTransition === "assign"
      ? req.user.id
      : ownerTransition === "unassign"
        ? null
        : ownerId || null;

  // Task_notes is an append-only history trail, not a value to overwrite -
  // every save adds one entry rather than replacing the array.
  const [callerRows] = await pool.query(
    "SELECT name FROM users WHERE user_id = ?",
    [req.user.id],
  );
  const existingNotes =
    typeof beforeRows[0].Task_notes === "string"
      ? JSON.parse(beforeRows[0].Task_notes)
      : beforeRows[0].Task_notes;
  const updatedNotes = [
    ...existingNotes,
    {
      state: nextState,
      changedBy: callerRows[0]?.name ?? "Unknown",
      changedAt: new Date().toISOString(),
      text: notes?.trim() || null,
    },
  ];

  const [result] = await pool.query(
    "UPDATE tasks SET Task_name = ?, Task_description = ?, Task_plan = ?, Task_state = ?, Task_owner = ?, Task_dueDate = ?, Task_notes = ?, updated_at = NOW(6) WHERE Task_id = ? AND updated_at <=> ?",
    [
      name,
      description || null,
      plan || null,
      nextState,
      nextOwnerId,
      dueDate || null,
      JSON.stringify(updatedNotes),
      id,
      updatedAt,
    ],
  );

  if (result.affectedRows === 0) {
    const [rows] = await pool.query(
      "SELECT Task_id FROM tasks WHERE Task_id = ?",
      [id],
    );
    throw rows.length === 0
      ? new AppError(404, "Task not found")
      : STALE_UPDATE_ERROR;
  }

  // Disabled for now - email notification works but isn't needed yet.
  // if (nextState === "Done" && nextState !== previousState) {
  //   try {
  //     let ownerName = null;
  //     if (nextOwnerId != null) {
  //       const [ownerRows] = await pool.query(
  //         "SELECT name FROM users WHERE user_id = ?",
  //         [nextOwnerId],
  //       );
  //       ownerName = ownerRows[0]?.name ?? null;
  //     }
  //
  //     await notifyTaskDone({
  //       taskRef: id,
  //       taskName: name,
  //       taskDescription: description,
  //       appAcronym: appId,
  //       ownerName,
  //       completedAt: new Date().toLocaleString(),
  //     });
  //   } catch (err) {
  //     console.error("Failed to send Done-state notification email:", err);
  //   }
  // }

  notifyWorkspaceChanged(appId);
  res.status(200).json({ message: "Task updated" });
};

// GET /api/workspace/events?appId=...&token=...
export const streamWorkspaceEvents = async (req, res) => {
  const { appId } = req.query;
  if (!appId) {
    throw new AppError(400, "appId is required");
  }

  openSseStream(req, res, (decoded, res) => {
    addWorkspaceClient(appId, res);
    return () => removeWorkspaceClient(appId, res);
  });
};
