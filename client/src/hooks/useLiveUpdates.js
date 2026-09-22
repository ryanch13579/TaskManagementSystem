import { useEffect } from "react";
import { BASE_URL } from "../api/client";

// Subscribes to one of the app's "something changed" SSE streams (see
// server/utils/sseRegistry.js) and calls `onChanged` whenever a "changed"
// event arrives - shared by every page that live-refreshes this way
// (Applications, Plans & Tasks, Task Board). `path` is the stream's route
// with any of its own query params already on it (e.g.
// "/workspace/events?appId=123"); pass `null` to skip subscribing, e.g.
// while a route param it depends on hasn't loaded yet. Always closes the
// connection on unmount or when `path`/`token` change - same
// EventSource + query-param-token pattern Layout.jsx uses for account
// updates (SSE can't set an Authorization header, so the token travels in
// the URL instead of through verifyToken).
export function useLiveUpdates(path, token, onChanged) {
  useEffect(() => {
    if (!path || !token) return;

    const joiner = path.includes("?") ? "&" : "?";
    const source = new EventSource(
      `${BASE_URL}${path}${joiner}token=${encodeURIComponent(token)}`,
    );
    source.addEventListener("changed", onChanged);

    return () => source.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, token]);
}
