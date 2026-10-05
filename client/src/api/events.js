// Paths of the server's live-update streams, for useEventStream.
export const eventStreams = {
  user: "/events",
  applications: "/applications/events",
  workspace: (appId) => `/workspace/events?appId=${encodeURIComponent(appId)}`,
};
