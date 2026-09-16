import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Database creation
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "nodelogin",
  waitForConnections: true,
  connectionLimit: 10,
  // Without this, mysql2 turns DATETIME columns into JS Date objects, which
  // only hold millisecond precision. `updated_at` is DATETIME(6) and is used
  // for the optimistic-lock check in updateUser (`updated_at <=> ?`) — a
  // round trip through Date would silently drop the sub-millisecond digits
  // NOW(6) actually writes, so the check would fail even when nothing else
  // changed. Keeping it as the raw MySQL string avoids that lossy round trip.
  dateStrings: true,
});

export default pool;
