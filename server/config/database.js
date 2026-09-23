import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "nodelogin",
  waitForConnections: true,
  connectionLimit: 10,
  // Without this, mysql2 returns DATETIME(6) columns as JS Date (millisecond
  // precision), silently dropping the sub-millisecond digits the
  // updated_at <=> ? optimistic-lock checks depend on.
  dateStrings: true,
});

export default pool;
