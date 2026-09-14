export const BASE_URL = "http://localhost:5000/api";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Registered by AuthContext so that any API call which comes back 403
// "disabled" can force an immediate logout, no matter which page triggered it.
let forcedLogoutHandler = null;
export function setForcedLogoutHandler(fn) {
  forcedLogoutHandler = fn;
}

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
      forcedLogoutHandler?.();
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
