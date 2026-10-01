import pool, { withTransaction } from "../config/database.js";
import { AppError, throwMissingOrStale } from "../utils/errors.js";
import { applicationChannel, workspaceChannel, EVERYONE } from "../utils/sse.js";

const DUPLICATE_MESSAGE = "Acronym is already in use by another application";

// The configurable permissions: request-body field -> App_permit_* column.
// Each holds the name of the one user group allowed to do that action on
// this application's tasks (null = nobody) - see PERMIT_FOR_STATE and
// CREATE_PERMIT in taskController.js for what each one allows.
const PERMIT_COLUMNS = {
  permitCreate: "App_permit_Create",
  permitOpen: "App_permit_Open",
  permitToDoList: "App_permit_toDoList",
  permitDoing: "App_permit_Doing",
  permitDone: "App_permit_Done",
};
const PERMIT_SELECT = Object.entries(PERMIT_COLUMNS)
  .map(([field, column]) => `${column} AS ${field}`)
  .join(", ");

// taskCount is included so the Applications page doesn't need to fetch
// every application's tasks just to count them.
const APP_FIELDS = `
  App_Acronym AS acronym, App_Description AS description,
  App_Rnumber AS rnumber, App_startDate AS startDate, App_endDate AS endDate,
  ${PERMIT_SELECT},
  created_at AS createdAt, updated_at AS updatedAt,
  (SELECT COUNT(*) FROM tasks WHERE Task_app_Acronym = App_Acronym) AS taskCount`;

const requireFields = ({ acronym, startDate, endDate }) => {
  if (!acronym || !startDate || !endDate) {
    throw new AppError(400, "Acronym, start date and end date are required");
  }
};

// The permits sent in the request body, as { columns, values }. A blank
// group means nobody is permitted; a field left out isn't included at all,
// so it keeps its current value (or the column default on create).
const readPermits = (body) => {
  const columns = [];
  const values = [];
  for (const [field, column] of Object.entries(PERMIT_COLUMNS)) {
    const group = body[field];
    if (group === undefined) continue;
    if (group !== null && (typeof group !== "string" || group.length > 50)) {
      throw new AppError(400, `Invalid group for ${field}`);
    }
    columns.push(column);
    values.push(group || null);
  }
  return { columns, values };
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
  const permits = readPermits(req.body);
  const columns = ["App_Acronym", "App_Description", "App_startDate", "App_endDate", ...permits.columns];

  await withTransaction(
    (db) =>
      db.query(
        `INSERT INTO \`Application\` (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
        [acronym, description || null, startDate, endDate, ...permits.values],
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
  const permits = readPermits(req.body);

  await withTransaction(async (db) => {
    const [result] = await db.query(
      `UPDATE \`Application\`
         SET App_Acronym = ?, App_Description = ?, App_startDate = ?, App_endDate = ?,
             ${permits.columns.map((column) => `${column} = ?, `).join("")}updated_at = NOW(6)
       WHERE App_Acronym = ? AND updated_at <=> ?`,
      [acronym, description || null, startDate, endDate, ...permits.values, id, updatedAt],
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
  // Open Plans & Tasks / Task Board pages decide which buttons to enable
  // from the permits, so they need to reload the app too.
  workspaceChannel.send(id, "changed");
  if (acronym !== id) workspaceChannel.send(acronym, "changed");
  res.status(200).json({ message: "Application updated" });
};
