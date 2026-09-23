export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Express 5 forwards rejected promises from async handlers/middleware here automatically.
export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ message: "Email already exists" });
  }
  console.error(err);
  res.status(500).json({ message: "Server error" });
};
