import jwt from "jsonwebtoken";
import pool from "../config/database.js";

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.query(
      "SELECT active FROM accounts WHERE id = ?",
      [decoded.id],
    );

    if (rows.length === 0 || !rows[0].active) {
      return res.status(403).json({ message: "Account has been disabled" });
    }

    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user?.roles?.includes("admin")) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};
