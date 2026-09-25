export const BASE_URL = "http://localhost:5000/api";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Layout registers a function here so that any request answered with
// "Account has been disabled" logs the user out, whichever page sent it.
let onAccountDisabled = null;
export function setForcedLogoutHandler(fn) {
  onAccountDisabled = fn;
}

// Sends a request to the server and returns the JSON reply.
// Throws an ApiError carrying the server's message if it fails.
async function request(path, { method = "GET", body, token } = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Could not reach the server");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.message || "Something went wrong";
    if (res.status === 403 && message === "Account has been disabled") {
      onAccountDisabled?.();
    }
    throw new ApiError(message, res.status);
  }
  return data;
}

export const api = {
  get: (path, token) => request(path, { token }),
  post: (path, body, token) => request(path, { method: "POST", body, token }),
  put: (path, body, token) => request(path, { method: "PUT", body, token }),
};
