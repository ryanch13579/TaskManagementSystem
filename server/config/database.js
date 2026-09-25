import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { AppError } from "../utils/errors.js";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "nodelogin",
  waitForConnections: true,
  connectionLimit: 10,
  // Return DATETIME columns as strings. A JS Date would drop the microseconds
  // that the `updated_at <=> ?` stale-edit checks compare against.
  dateStrings: true,
});

// Runs fn(connection) in a transaction: commit on success, roll back on any
// error. A UNIQUE-key clash becomes a 409 with `duplicateMessage`.
export const withTransaction = async (fn, duplicateMessage = "Already exists") => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await fn(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err.code === "ER_DUP_ENTRY" ? new AppError(409, duplicateMessage) : err;
  } finally {
    connection.release();
  }
};

export default pool;
