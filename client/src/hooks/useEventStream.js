import { useEffect, useRef } from "react";
import { BASE_URL } from "../api/client";
import { useAuth } from "../context/AuthContext";

// Listens to one of the server's live-update streams while the component is
// on screen (see server/controllers/eventsController.js).
//
//   useEventStream("/workspace/events?appId=ABC", { changed: () => reload() });
//
// `handlers` maps an event name to a function that gets the event's data.
// Pass path = null to not listen at all.
export function useEventStream(path, handlers) {
  const { token } = useAuth();

  // Always call the latest handlers without reconnecting on every render.
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!path || !token) return;

    // EventSource can't send headers, so the token goes in the URL.
    const joiner = path.includes("?") ? "&" : "?";
    const source = new EventSource(`${BASE_URL}${path}${joiner}token=${encodeURIComponent(token)}`);

    for (const eventName of Object.keys(handlersRef.current)) {
      source.addEventListener(eventName, (event) =>
        handlersRef.current[eventName]?.(JSON.parse(event.data)),
      );
    }
    return () => source.close();
  }, [path, token]);
}
