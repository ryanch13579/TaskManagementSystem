import crypto from "crypto";
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

// Same transaction-wrapped duplicate-key guard as userController's
// withDuplicateGuard - the UNIQUE key on applications.app_acronym is what
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
    throw err.code === "ER_DUP_ENTRY" ? DUPLICATE_ACRONYM_ERROR : err;
  } finally {
    connection.release();
  }
};

const SELECT_FIELDS =
  "app_id AS id, app_name AS name, app_acronym AS acronym, app_description AS description, " +
  "app_rnumber AS rnumber, app_start_date AS startDate, app_end_date AS endDate, " +
  "created_at AS createdAt, updated_at AS updatedAt";

// GET /api/applications
export const getApplications = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS} FROM applications ORDER BY created_at`,
  );
  res.status(200).json(rows);
};

// GET /api/applications/:id
export const getApplicationById = async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS} FROM applications WHERE app_id = ?`,
    [id],
  );
  if (rows.length === 0) {
    throw new AppError(404, "Application not found");
  }
  res.status(200).json(rows[0]);
};

// POST /api/applications
export const createApplication = async (req, res) => {
  const { name, acronym, description, rnumber, startDate, endDate } =
    req.body;
  if (!name || !acronym || !startDate || !endDate) {
    throw new AppError(
      400,
      "Name, acronym, start date and end date are required",
    );
  }

  const id = crypto.randomUUID();
  await withDuplicateGuard(async (connection) => {
    await connection.query(
      "INSERT INTO applications (app_id, app_name, app_acronym, app_description, app_rnumber, app_start_date, app_end_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        name,
        acronym,
        description || null,
        rnumber ?? null,
        startDate,
        endDate,
      ],
    );
  });

  notifyApplicationsChanged();
  res.status(201).json({ message: "Application created", id });
};

// PUT /api/applications/:id
export const updateApplication = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    acronym,
    description,
    rnumber,
    startDate,
    endDate,
    updated_at: updatedAt,
  } = req.body;

  if (!name || !acronym || !startDate || !endDate) {
    throw new AppError(
      400,
      "Name, acronym, start date and end date are required",
    );
  }
  if (updatedAt === undefined) {
    throw new AppError(
      400,
      "Missing updated_at for the application being updated",
    );
  }

  await withDuplicateGuard(async (connection) => {
    // See userController.updateUser for why updated_at <=> ? and NOW(6)
    // (instead of relying on ON UPDATE CURRENT_TIMESTAMP) are both needed
    // for this to be a correct optimistic-concurrency check.
    const [result] = await connection.query(
      "UPDATE applications SET app_name = ?, app_acronym = ?, app_description = ?, app_rnumber = ?, app_start_date = ?, app_end_date = ?, updated_at = NOW(6) WHERE app_id = ? AND updated_at <=> ?",
      [
        name,
        acronym,
        description || null,
        rnumber ?? null,
        startDate,
        endDate,
        id,
        updatedAt,
      ],
    );

    if (result.affectedRows === 0) {
      const [rows] = await connection.query(
        "SELECT app_id FROM applications WHERE app_id = ?",
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
