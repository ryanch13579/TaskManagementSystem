import pool from "../config/database.js";
import { AppError } from "../utils/errors.js";
import { notifyWorkspaceChanged } from "../utils/workspaceSseClients.js";

const DUPLICATE_NAME_ERROR = new AppError(
  409,
  "A plan with this name already exists for this application",
);
const STALE_UPDATE_ERROR = new AppError(
  409,
  "This plan was changed by someone else. Refresh and try again.",
);

// Same transaction-wrapped duplicate-key guard as userController's
// withDuplicateGuard - the UNIQUE key on (plan_app_id, plan_name) is what
// actually makes this atomic under concurrent inserts.
const withDuplicateGuard = async (fn) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await fn(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err.code === "ER_DUP_ENTRY" ? DUPLICATE_NAME_ERROR : err;
  } finally {
    connection.release();
  }
};

const SELECT_FIELDS =
  "plan_id AS id, plan_name AS name, plan_app_id AS appId, " +
  "plan_start_date AS startDate, plan_end_date AS endDate, updated_at AS updatedAt";

// GET /api/plans?appId=...
export const getPlans = async (req, res) => {
  const { appId } = req.query;
  const [rows] = appId
    ? await pool.query(
        `SELECT ${SELECT_FIELDS} FROM plans WHERE plan_app_id = ? ORDER BY plan_id`,
        [appId],
      )
    : await pool.query(`SELECT ${SELECT_FIELDS} FROM plans ORDER BY plan_id`);
  res.status(200).json(rows);
};

// POST /api/plans
export const createPlan = async (req, res) => {
  const { name, appId, startDate, endDate } = req.body;
  if (!name || !appId || !startDate || !endDate) {
    throw new AppError(
      400,
      "Name, application and start/end dates are required",
    );
  }

  const insertId = await withDuplicateGuard(async (connection) => {
    const [result] = await connection.query(
      "INSERT INTO plans (plan_name, plan_app_id, plan_start_date, plan_end_date) VALUES (?, ?, ?, ?)",
      [name, appId, startDate, endDate],
    );
    return result.insertId;
  });

  notifyWorkspaceChanged(appId);
  res.status(201).json({ message: "Plan created", id: insertId });
};

// PUT /api/plans/:id
export const updatePlan = async (req, res) => {
  const { id } = req.params;
  const { name, startDate, endDate, updated_at: updatedAt } = req.body;

  if (!name || !startDate || !endDate) {
    throw new AppError(400, "Name and start/end dates are required");
  }
  if (updatedAt === undefined) {
    throw new AppError(400, "Missing updated_at for the plan being updated");
  }

  const appId = await withDuplicateGuard(async (connection) => {
    const [result] = await connection.query(
      "UPDATE plans SET plan_name = ?, plan_start_date = ?, plan_end_date = ?, updated_at = NOW(6) WHERE plan_id = ? AND updated_at <=> ?",
      [name, startDate, endDate, id, updatedAt],
    );

    if (result.affectedRows === 0) {
      const [rows] = await connection.query(
        "SELECT plan_id FROM plans WHERE plan_id = ?",
        [id],
      );
      throw rows.length === 0
        ? new AppError(404, "Plan not found")
        : STALE_UPDATE_ERROR;
    }

    // plan_app_id isn't editable, so it's not in the request body - read it
    // back here (the request only ever has it for the SSE broadcast below).
    const [rows] = await connection.query(
      "SELECT plan_app_id FROM plans WHERE plan_id = ?",
      [id],
    );
    return rows[0].plan_app_id;
  });

  notifyWorkspaceChanged(appId);
  res.status(200).json({ message: "Plan updated" });
};
