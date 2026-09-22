import jwt from "jsonwebtoken";
import { AppError } from "./errors.js";

// Handles the boilerplate every SSE endpoint in this app needs: validate the
// query-param token (EventSource can't set an Authorization header, so this
// is the only way these endpoints authenticate, in place of verifyToken),
// open the event-stream response, and keep the connection alive with a
// heartbeat until the client disconnects.
//
// `onOpen(decoded, res)` is called once the stream is open - it registers
// the connection with whichever client registry the caller uses (see
// sseRegistry.js) and returns a cleanup function to run when the connection
// closes (typically that registry's `remove`).
export const openSseStream = (req, res, onOpen) => {
  const { token } = req.query;
  if (!token) {
    throw new AppError(401, "No token provided");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError(401, "Invalid or expired token");
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write("\n");

  const cleanup = onOpen(decoded, res);
  const heartbeat = setInterval(() => res.write(":heartbeat\n\n"), 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    cleanup?.();
  });
};
