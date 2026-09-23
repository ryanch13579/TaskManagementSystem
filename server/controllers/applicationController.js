import pool from "../config/database.js";
import { AppError } from "../utils/errors.js";
import {
  addApplicationClient,
  removeApplicationClient,
  notifyApplicationsChanged,
} from "../utils/applicationSseClients.js";
import { openSseStream } from "../utils/sseHandshake.js";

const DUPLICATE_ACRONYM_ERROR = new AppError(
  409,
  "Acronym is already in use by another application",
);
const STALE_UPDATE_ERROR = new AppError(
  409,
  "This application was changed by someone else. Refresh and try again.",
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
    throw err.code === "ER_DUP_ENTRY" ? DUPLICATE_ACRONYM_ERROR : err;
  } finally {
    connection.release();
  }
};

const SELECT_FIELDS =
  "App_Acronym AS acronym, App_Description AS description, " +
  "App_Rnumber AS rnumber, App_startDate AS startDate, App_endDate AS endDate, " +
  "created_at AS createdAt, updated_at AS updatedAt";

// GET /api/applications
export const getApplications = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS} FROM \`Application\` ORDER BY created_at`,
  );
  res.status(200).json(rows);
};

// GET /api/applications/:id (:id is the App_Acronym)
export const getApplicationById = async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS} FROM \`Application\` WHERE App_Acronym = ?`,
    [id],
  );
  if (rows.length === 0) {
    throw new AppError(404, "Application not found");
  }
  res.status(200).json(rows[0]);
};

// POST /api/applications
export const createApplication = async (req, res) => {
  const { acronym, description, startDate, endDate } = req.body;
  if (!acronym || !startDate || !endDate) {
    throw new AppError(400, "Acronym, start date and end date are required");
  }

  await withDuplicateGuard(async (connection) => {
    await connection.query(
      "INSERT INTO `Application` (App_Acronym, App_Description, App_startDate, App_endDate) VALUES (?, ?, ?, ?)",
      [acronym, description || null, startDate, endDate],
    );
  });

  notifyApplicationsChanged();
  res.status(201).json({ message: "Application created", acronym });
};

// PUT /api/applications/:id
// :id is the app's current App_Acronym; body.acronym is the new value (or
// the same one). Renaming cascades into plans/tasks via ON UPDATE CASCADE.
export const updateApplication = async (req, res) => {
  const { id } = req.params;
  const {
    acronym,
    description,
    startDate,
    endDate,
    updated_at: updatedAt,
  } = req.body;

  if (!acronym || !startDate || !endDate) {
    throw new AppError(400, "Acronym, start date and end date are required");
  }
  if (updatedAt === undefined) {
    throw new AppError(
      400,
      "Missing updated_at for the application being updated",
    );
  }

  await withDuplicateGuard(async (connection) => {
    // App_Rnumber is left out of the SET clause - it's the running
    // task-number counter, not an editable field.
    const [result] = await connection.query(
      "UPDATE `Application` SET App_Acronym = ?, App_Description = ?, App_startDate = ?, App_endDate = ?, updated_at = NOW(6) WHERE App_Acronym = ? AND updated_at <=> ?",
      [acronym, description || null, startDate, endDate, id, updatedAt],
    );

    if (result.affectedRows === 0) {
      const [rows] = await connection.query(
        "SELECT App_Acronym FROM `Application` WHERE App_Acronym = ?",
        [id],
      );
      throw rows.length === 0
        ? new AppError(404, "Application not found")
        : STALE_UPDATE_ERROR;
    }
  });

  notifyApplicationsChanged();
  res.status(200).json({ message: "Application updated" });
};

// GET /api/applications/events?token=...
// Live "something changed" signal for the Applications page.
export const streamApplicationEvents = async (req, res) => {
  openSseStream(req, res, (decoded, res) => {
    addApplicationClient(res);
    return () => removeApplicationClient(res);
  });
};
