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
  "Plan_name AS name, Plan_startDate AS startDate, " +
  "Plan_endDate AS endDate, updated_at AS updatedAt";

// GET /api/plans?appId=...
export const getPlans = async (req, res) => {
  const { appId } = req.query;
  const [rows] = appId
    ? await pool.query(
        `SELECT ${SELECT_FIELDS} FROM plans WHERE Plan_app_Acronym = ? ORDER BY Plan_name`,
        [appId],
      )
    : await pool.query(`SELECT ${SELECT_FIELDS} FROM plans ORDER BY Plan_name`);
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

  await withDuplicateGuard(async (connection) => {
    await connection.query(
      "INSERT INTO plans (Plan_name, Plan_app_Acronym, Plan_startDate, Plan_endDate) VALUES (?, ?, ?, ?)",
      [name, appId, startDate, endDate],
    );
  });

  notifyWorkspaceChanged(appId);
  res.status(201).json({ message: "Plan created", name });
};

// PUT /api/plans/:appId/:name (:name is the plan's current name; body.name
// is the new value, or the same one)
export const updatePlan = async (req, res) => {
  const { appId, name: currentName } = req.params;
  const { name, startDate, endDate, updated_at: updatedAt } = req.body;

  if (!name || !startDate || !endDate) {
    throw new AppError(400, "Name and start/end dates are required");
  }
  if (updatedAt === undefined) {
    throw new AppError(400, "Missing updated_at for the plan being updated");
  }

  await withDuplicateGuard(async (connection) => {
    const [result] = await connection.query(
      "UPDATE plans SET Plan_name = ?, Plan_startDate = ?, Plan_endDate = ?, updated_at = NOW(6) " +
        "WHERE Plan_name = ? AND Plan_app_Acronym = ? AND updated_at <=> ?",
      [name, startDate, endDate, currentName, appId, updatedAt],
    );

    if (result.affectedRows === 0) {
      const [rows] = await connection.query(
        "SELECT 1 FROM plans WHERE Plan_name = ? AND Plan_app_Acronym = ?",
        [currentName, appId],
      );
      throw rows.length === 0
        ? new AppError(404, "Plan not found")
        : STALE_UPDATE_ERROR;
    }
  });

  notifyWorkspaceChanged(appId);
  res.status(200).json({ message: "Plan updated" });
};
