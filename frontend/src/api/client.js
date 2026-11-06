// The access token lives only in memory; the refresh token is an httpOnly cookie the browser sends to /api/auth.
let accessToken = null;
let refreshing = null;
let onSignedOut = () => {};

export const setAccessToken = (token) => (accessToken = token);
export const setSignedOutHandler = (fn) => (onSignedOut = fn);

export class ApiError extends Error {
  constructor(status, body) {
    const msg = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
    super(msg || `Request failed (${status})`);
    this.status = status;
    this.body = body;
  }
}

async function send(path, { method = "GET", body } = {}) {
  return fetch(`/api${path}`, {
    method,
    credentials: "same-origin",
    headers: {
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function parse(res) {
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

/** Gets a new access token from the refresh cookie. Concurrent callers share one request (rotation allows one use). */
export function refreshSession() {
  refreshing ??= send("/auth/refresh", { method: "POST" })
    .then(parse)
    .then((data) => {
      setAccessToken(data.accessToken);
      return data;
    })
    .finally(() => (refreshing = null));
  return refreshing;
}

export async function api(path, options) {
  let res = await send(path, options);
  if (res.status === 401 && !path.startsWith("/auth/")) {
    try {
      await refreshSession();
    } catch {
      setAccessToken(null);
      onSignedOut();
      throw new ApiError(401, { message: "Your session has ended. Please sign in again." });
    }
    res = await send(path, options);
  }
  return parse(res);
}
