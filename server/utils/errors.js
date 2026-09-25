// Throw one of these from any controller to send `{ message }` with `status`.
export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Every edit sends back the `updated_at` it last saw, and the UPDATE only
// matches if it's unchanged. When nothing matched, this works out why:
// the row is gone (404), or someone else saved it first (409).
// `label` is used in the message, e.g. "Task".
export const throwMissingOrStale = async (db, existsSql, params, label) => {
  const [rows] = await db.query(existsSql, params);
  if (rows.length === 0) {
    throw new AppError(404, `${label} not found`);
  }
  throw new AppError(
    409,
    `This ${label.toLowerCase()} was changed by someone else. Refresh and try again.`,
  );
};

// Express 5 forwards errors thrown in async handlers here automatically.
export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: "Server error" });
};
