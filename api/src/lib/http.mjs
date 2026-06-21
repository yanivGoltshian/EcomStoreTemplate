// Shared helpers for the HTTP-triggered Functions.
import { isAdmin } from "./auth.mjs";

export function json(status, data) {
  return {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Admin API responses are always live data — never let the browser or any
      // proxy serve a cached copy, or an edit can appear to "revert" on reload.
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
    body: JSON.stringify(data),
  };
}

// Returns an error response if the caller is not an admin, otherwise null.
export async function requireAdmin(request) {
  if (!(await isAdmin(request))) {
    return json(403, { error: "Forbidden — admin sign-in required." });
  }
  return null;
}

export async function readBody(request) {
  try {
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Invalid JSON body.");
  }
}
