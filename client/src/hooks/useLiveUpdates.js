import { useEffect } from "react";
import { BASE_URL } from "../api/client";

// Subscribes to one of the app's "something changed" SSE streams and calls
// onChanged when a "changed" event arrives. `path` includes its own query
// params (e.g. "/workspace/events?appId=123"); pass null to skip
// subscribing. Token travels as a query param since SSE can't set an
// Authorization header.
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
