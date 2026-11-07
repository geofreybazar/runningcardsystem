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

async function send(path, { method = "GET", body, signal } = {}) {
  return fetch(`/api${path}`, {
    method,
    signal,
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

/** Splits Server-Sent Events text into complete events; returns them and the unfinished rest. */
export function parseSse(buffer) {
  const blocks = buffer.split("\n\n");
  const rest = blocks.pop();
  const events = blocks.flatMap((block) => {
    const type = /^event: ?(.*)$/m.exec(block)?.[1] ?? "message";
    const lines = block.split("\n").filter((l) => l.startsWith("data:"));
    return lines.length ? [{ type, data: lines.map((l) => l.replace(/^data: ?/, "")).join("\n") }] : [];
  });
  return { events, rest };
}

/**
 * Reads an SSE endpoint, calling onEvent(type, data) for each JSON event. Uses fetch rather than EventSource, which
 * can't send the bearer token. Resolves when the server ends the stream; the caller reconnects.
 */
export async function stream(path, onEvent, signal) {
  let res = await send(path, { signal });
  if (res.status === 401) {
    await refreshSession().catch(() => {
      setAccessToken(null);
      onSignedOut();
      throw new ApiError(401, null);
    });
    res = await send(path, { signal });
  }
  if (!res.ok) throw new ApiError(res.status, null);
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    const parsed = parseSse(buffer + value);
    buffer = parsed.rest;
    for (const e of parsed.events) if (e.type !== "ping" && e.data) onEvent(e.type, JSON.parse(e.data));
  }
}
