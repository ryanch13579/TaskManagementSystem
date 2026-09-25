import pool, { withTransaction } from "../config/database.js";
import { AppError, throwMissingOrStale } from "../utils/errors.js";
import { workspaceChannel } from "../utils/sse.js";

const DUPLICATE_MESSAGE = "A plan with this name already exists for this application";

// "2026-01-31 00:00:00" or "2026-01-31" -> "31/01/2026"
const toDMY = (value) => String(value).slice(0, 10).split("-").reverse().join("/");

// A plan must start and end within its application's start/end dates.
// FOR UPDATE locks the application row so its dates can't change
// underneath us before the plan is saved.
const checkPlanDates = async (db, appId, startDate, endDate) => {
  const start = String(startDate).slice(0, 10);
  const end = String(endDate).slice(0, 10);
  if (end < start) {
    throw new AppError(400, "End date can't be before the start date");
  }
  const [apps] = await db.query(
    "SELECT App_startDate AS startDate, App_endDate AS endDate FROM `Application` WHERE App_Acronym = ? FOR UPDATE",
    [appId],
  );
  if (apps.length === 0) {
    throw new AppError(404, "Application not found");
  }
  const appStart = apps[0].startDate.slice(0, 10);
  const appEnd = apps[0].endDate.slice(0, 10);
  if (start < appStart || end > appEnd) {
    throw new AppError(
      400,
      `Plan dates must be within the application's dates (${toDMY(appStart)} - ${toDMY(appEnd)})`,
    );
  }
};

const PLAN_FIELDS =
  "Plan_name AS name, Plan_startDate AS startDate, Plan_endDate AS endDate, updated_at AS updatedAt";

// GET /api/plans?appId=...
export const getPlans = async (req, res) => {
  if (!req.query.appId) {
    throw new AppError(400, "appId is required");
  }
  const [rows] = await pool.query(
    `SELECT ${PLAN_FIELDS} FROM plans WHERE Plan_app_Acronym = ? ORDER BY Plan_name`,
    [req.query.appId],
  );
  res.status(200).json(rows);
};

// POST /api/plans
export const createPlan = async (req, res) => {
  const { name, appId, startDate, endDate } = req.body;
  if (!name || !appId || !startDate || !endDate) {
    throw new AppError(400, "Name, application and start/end dates are required");
  }

  await withTransaction(async (db) => {
    await checkPlanDates(db, appId, startDate, endDate);
    await db.query(
      "INSERT INTO plans (Plan_name, Plan_app_Acronym, Plan_startDate, Plan_endDate) VALUES (?, ?, ?, ?)",
      [name, appId, startDate, endDate],
    );
  }, DUPLICATE_MESSAGE);

  workspaceChannel.send(appId, "changed");
  res.status(201).json({ message: "Plan created", name });
};

// PUT /api/plans/:appId/:name
// :name = the plan's current name; body.name = the new one (may be the same).
export const updatePlan = async (req, res) => {
  const { appId, name: currentName } = req.params;
  const { name, startDate, endDate, updated_at: updatedAt } = req.body;

  if (!name || !startDate || !endDate) {
    throw new AppError(400, "Name and start/end dates are required");
  }
  if (updatedAt === undefined) {
    throw new AppError(400, "Missing updated_at for the plan being updated");
  }

  await withTransaction(async (db) => {
    await checkPlanDates(db, appId, startDate, endDate);
    const [result] = await db.query(
      `UPDATE plans SET Plan_name = ?, Plan_startDate = ?, Plan_endDate = ?, updated_at = NOW(6)
       WHERE Plan_name = ? AND Plan_app_Acronym = ? AND updated_at <=> ?`,
      [name, startDate, endDate, currentName, appId, updatedAt],
    );
    if (result.affectedRows === 0) {
      await throwMissingOrStale(
        db,
        "SELECT 1 FROM plans WHERE Plan_name = ? AND Plan_app_Acronym = ?",
        [currentName, appId],
        "Plan",
      );
    }
  }, DUPLICATE_MESSAGE);

  workspaceChannel.send(appId, "changed");
  res.status(200).json({ message: "Plan updated" });
};
