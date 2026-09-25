import pool, { withTransaction } from "../config/database.js";
import { AppError, throwMissingOrStale } from "../utils/errors.js";
import { applicationChannel, EVERYONE } from "../utils/sse.js";

const DUPLICATE_MESSAGE = "Acronym is already in use by another application";

// taskCount is included so the Applications page doesn't need to fetch
// every application's tasks just to count them.
const APP_FIELDS = `
  App_Acronym AS acronym, App_Description AS description,
  App_Rnumber AS rnumber, App_startDate AS startDate, App_endDate AS endDate,
  created_at AS createdAt, updated_at AS updatedAt,
  (SELECT COUNT(*) FROM tasks WHERE Task_app_Acronym = App_Acronym) AS taskCount`;

const requireFields = ({ acronym, startDate, endDate }) => {
  if (!acronym || !startDate || !endDate) {
    throw new AppError(400, "Acronym, start date and end date are required");
  }
};

// GET /api/applications
export const getApplications = async (req, res) => {
  const [rows] = await pool.query(`SELECT ${APP_FIELDS} FROM \`Application\` ORDER BY created_at`);
  res.status(200).json(rows);
};

// GET /api/applications/:id (id = App_Acronym)
export const getApplicationById = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT ${APP_FIELDS} FROM \`Application\` WHERE App_Acronym = ?`,
    [req.params.id],
  );
  if (rows.length === 0) {
    throw new AppError(404, "Application not found");
  }
  res.status(200).json(rows[0]);
};

// POST /api/applications
export const createApplication = async (req, res) => {
  requireFields(req.body);
  const { acronym, description, startDate, endDate } = req.body;

  await withTransaction(
    (db) =>
      db.query(
        "INSERT INTO `Application` (App_Acronym, App_Description, App_startDate, App_endDate) VALUES (?, ?, ?, ?)",
        [acronym, description || null, startDate, endDate],
      ),
    DUPLICATE_MESSAGE,
  );

  applicationChannel.send(EVERYONE, "changed");
  res.status(201).json({ message: "Application created", acronym });
};

// PUT /api/applications/:id
// id = the current acronym; body.acronym = the new one (may be the same).
// A rename carries over to its plans/tasks via ON UPDATE CASCADE.
// App_Rnumber isn't editable - it's the running task-number counter.
export const updateApplication = async (req, res) => {
  requireFields(req.body);
  const { id } = req.params;
  const { acronym, description, startDate, endDate, updated_at: updatedAt } = req.body;
  if (updatedAt === undefined) {
    throw new AppError(400, "Missing updated_at for the application being updated");
  }

  await withTransaction(async (db) => {
    const [result] = await db.query(
      `UPDATE \`Application\`
         SET App_Acronym = ?, App_Description = ?, App_startDate = ?, App_endDate = ?, updated_at = NOW(6)
       WHERE App_Acronym = ? AND updated_at <=> ?`,
      [acronym, description || null, startDate, endDate, id, updatedAt],
    );
    if (result.affectedRows === 0) {
      await throwMissingOrStale(db, "SELECT 1 FROM `Application` WHERE App_Acronym = ?", [id], "Application");
    }
    // Every plan must stay within the application's dates (see
    // checkPlanDates in planController.js), so new dates can't cut any off.
    const [outside] = await db.query(
      `SELECT Plan_name FROM plans
       WHERE Plan_app_Acronym = ? AND (DATE(Plan_startDate) < DATE(?) OR DATE(Plan_endDate) > DATE(?))
       ORDER BY Plan_name`,
      [acronym, startDate, endDate],
    );
    if (outside.length > 0) {
      const names = outside.map((plan) => plan.Plan_name).join(", ");
      throw new AppError(400, `These plans would fall outside the new dates: ${names}`);
    }
  }, DUPLICATE_MESSAGE);

  applicationChannel.send(EVERYONE, "changed");
  res.status(200).json({ message: "Application updated" });
};
