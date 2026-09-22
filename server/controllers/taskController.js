import pool from "../config/database.js";
import { AppError } from "../utils/errors.js";
import {
  addWorkspaceClient,
  removeWorkspaceClient,
  notifyWorkspaceChanged,
} from "../utils/workspaceSseClients.js";
import { openSseStream } from "../utils/sseHandshake.js";

const STALE_UPDATE_ERROR = new AppError(
  409,
  "This task was changed by someone else. Refresh and try again.",
);

// task_owner isn't just whatever the client sends - specific state
// transitions drive it instead: starting a task assigns the caller as
// owner, and sending it back to To Do clears it back to unassigned (it's
// back in the pool for anyone to pick up). Rejecting a Done task back to
// Doing keeps the current owner - it's still their task, just not approved
// yet. Any other transition (including a plain edit, where `state` is
// unchanged) leaves task_owner exactly as the client passed it.
const OWNER_ON_TRANSITION = {
  "To Do>Doing": "assign", // Start Task
  "Doing>To Do": "unassign", // Reject Task
};

const SELECT_FIELDS =
  "task_id AS id, task_name AS name, task_description AS description, " +
  "task_plan_id AS planId, task_app_id AS appId, task_state AS state, " +
  "task_creator AS creatorId, task_owner AS ownerId, " +
  "task_create_date AS createDate, task_due_date AS dueDate, " +
  "task_notes AS notes, updated_at AS updatedAt";

const formatTask = (row) => ({
  ...row,
  notes: typeof row.notes === "string" ? JSON.parse(row.notes) : row.notes,
});

// GET /api/tasks?appId=...&planId=...
// planId=none returns tasks with no plan; omitting it returns every task
// for the app.
export const getTasks = async (req, res) => {
  const { appId, planId } = req.query;

  const conditions = [];
  const params = [];
  if (appId) {
    conditions.push("task_app_id = ?");
    params.push(appId);
  }
  if (planId === "none") {
    conditions.push("task_plan_id IS NULL");
  } else if (planId) {
    conditions.push("task_plan_id = ?");
    params.push(planId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS} FROM tasks ${where} ORDER BY task_id`,
    params,
  );
  res.status(200).json(rows.map(formatTask));
};

// POST /api/tasks
export const createTask = async (req, res) => {
  const { name, description, planId, appId, ownerId, dueDate, notes } =
    req.body;
  if (!name || !appId) {
    throw new AppError(400, "Name and application are required");
  }

  // task_creator always comes from the authenticated caller, never the body.
  const creatorId = req.user.id;
  const [result] = await pool.query(
    "INSERT INTO tasks (task_name, task_description, task_plan_id, task_app_id, task_creator, task_owner, task_due_date, task_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      name,
      description || null,
      planId || null,
      appId,
      creatorId,
      ownerId || null,
      dueDate || null,
      JSON.stringify(notes ?? []),
    ],
  );

  // Seed the history trail with the task's starting state (tasks always
  // start life as "Open" - see the task_state column default).
  await pool.query(
    "INSERT INTO task_history (task_id, state, changed_by) VALUES (?, ?, ?)",
    [result.insertId, "Open", creatorId],
  );

  notifyWorkspaceChanged(appId);
  res.status(201).json({ message: "Task created", id: result.insertId });
};

// PUT /api/tasks/:id
export const updateTask = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    planId,
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

  // Read the current state (and app id, for the SSE broadcast below) first -
  // the UPDATE below only ever affects one row, so there's nothing else to
  // compare it against afterwards to tell whether the state actually changed.
  const [beforeRows] = await pool.query(
    "SELECT task_state, task_app_id FROM tasks WHERE task_id = ?",
    [id],
  );
  if (beforeRows.length === 0) {
    throw new AppError(404, "Task not found");
  }
  const previousState = beforeRows[0].task_state;
  const appId = beforeRows[0].task_app_id;
  const nextState = state || "Open";

  // OWNER_ON_TRANSITION (above) says whether this specific state change
  // forces an owner; if it doesn't (most transitions, and any plain edit),
  // fall through to whatever ownerId the client sent.
  const ownerTransition = OWNER_ON_TRANSITION[`${previousState}>${nextState}`];
  const nextOwnerId =
    ownerTransition === "assign"
      ? req.user.id
      : ownerTransition === "unassign"
        ? null
        : ownerId || null;

  const [result] = await pool.query(
    "UPDATE tasks SET task_name = ?, task_description = ?, task_plan_id = ?, task_state = ?, task_owner = ?, task_due_date = ?, task_notes = ?, updated_at = NOW(6) WHERE task_id = ? AND updated_at <=> ?",
    [
      name,
      description || null,
      planId || null,
      nextState,
      nextOwnerId,
      dueDate || null,
      JSON.stringify(notes ?? []),
      id,
      updatedAt,
    ],
  );

  if (result.affectedRows === 0) {
    const [rows] = await pool.query(
      "SELECT task_id FROM tasks WHERE task_id = ?",
      [id],
    );
    throw rows.length === 0
      ? new AppError(404, "Task not found")
      : STALE_UPDATE_ERROR;
  }

  if (nextState !== previousState) {
    await pool.query(
      "INSERT INTO task_history (task_id, state, changed_by) VALUES (?, ?, ?)",
      [id, nextState, req.user.id],
    );
  }

  // Broadcast on every successful update, not just state/owner changes - a
  // renamed task or a reassigned plan should refresh other open boards too,
  // and the client just re-fetches on this signal rather than caring why.
  notifyWorkspaceChanged(appId);
  res.status(200).json({ message: "Task updated" });
};

// GET /api/tasks/:id/history
export const getTaskHistory = async (req, res) => {
  const { id } = req.params;
  const [taskRows] = await pool.query(
    "SELECT task_id FROM tasks WHERE task_id = ?",
    [id],
  );
  if (taskRows.length === 0) {
    throw new AppError(404, "Task not found");
  }

  const [rows] = await pool.query(
    "SELECT th.state, th.changed_at AS changedAt, u.name AS changedBy " +
      "FROM task_history th JOIN users u ON u.user_id = th.changed_by " +
      "WHERE th.task_id = ? ORDER BY th.changed_at DESC, th.history_id DESC",
    [id],
  );
  res.status(200).json(rows);
};

// DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  const { id } = req.params;
  // Read the app id before deleting - there's no row left to read it from
  // afterwards, and notifyWorkspaceChanged needs it to know which boards to ping.
  const [rows] = await pool.query(
    "SELECT task_app_id FROM tasks WHERE task_id = ?",
    [id],
  );
  if (rows.length === 0) {
    throw new AppError(404, "Task not found");
  }

  await pool.query("DELETE FROM tasks WHERE task_id = ?", [id]);

  notifyWorkspaceChanged(rows[0].task_app_id);
  res.status(200).json({ message: "Task deleted" });
};

// GET /api/workspace/events?appId=...&token=...
// Live "something changed" signal shared by the Plans & Tasks page and the
// Task Board. Lives here rather than in its own controller since
// taskController already needed most of these imports, but it's pinged by
// planController's writes too - see workspaceSseClients.js.
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
