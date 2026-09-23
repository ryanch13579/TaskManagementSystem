import jwt from "jsonwebtoken";
import { AppError } from "./errors.js";

// Shared SSE boilerplate: auth via a query-param token (EventSource can't
// set an Authorization header), open the stream, heartbeat until the client
// disconnects. `onOpen(decoded, res)` registers the connection with the
// caller's registry (see sseRegistry.js) and returns its cleanup function.
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
