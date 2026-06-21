// Authorization for the admin API.
//
// Two supported modes:
//   1) Google Sign-In (production, $0 hosting): the admin panel signs in with
//      Google and sends the Google ID token as `Authorization: Bearer <token>`.
//      We cryptographically verify the token against Google, require a verified
//      email, then check it against the ADMIN_EMAILS allowlist. Configure the
//      Function app settings GOOGLE_CLIENT_ID and ADMIN_EMAILS (comma separated).
//   2) Local dev: ADMIN_DEV=1 bypasses all checks (tools/admin-local.mjs sets it).
//
// A legacy Static Web Apps principal-role check remains as a fallback for when
// neither Google nor dev mode is configured.

export function getPrincipal(request) {
  let raw;
  try {
    raw = request.headers?.get?.("x-ms-client-principal");
  } catch {
    raw = undefined;
  }
  if (!raw && request.headers && typeof request.headers === "object") {
    raw = request.headers["x-ms-client-principal"];
  }
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

export function getBearerToken(request) {
  // Primary: custom header. Azure Static Web Apps overwrites the `Authorization`
  // header on requests to managed functions with its own internal token, so the
  // admin panel sends the Google ID token in `X-Admin-Token` instead.
  const fromCustom = readHeader(request, "x-admin-token");
  if (fromCustom && typeof fromCustom === "string" && fromCustom.trim()) {
    return fromCustom.trim();
  }
  // Fallback: `Authorization: Bearer <token>` (used by the local dev harness,
  // where SWA's header injection is not present).
  const raw = readHeader(request, "authorization");
  if (!raw || typeof raw !== "string") return null;
  const m = /^Bearer\s+(.+)$/i.exec(raw.trim());
  return m ? m[1].trim() : null;
}

function readHeader(request, name) {
  let raw;
  try {
    raw = request.headers?.get?.(name);
  } catch {
    raw = undefined;
  }
  if (!raw && request.headers && typeof request.headers === "object") {
    raw =
      request.headers[name] ||
      request.headers[name.toLowerCase()] ||
      request.headers[name.toUpperCase()];
  }
  return raw;
}

export function adminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function emailAllowed(email) {
  if (!email) return false;
  return adminEmails().includes(String(email).toLowerCase());
}

let _client = null;
async function verifyGoogleToken(token, clientId) {
  if (!_client) {
    const { OAuth2Client } = await import("google-auth-library");
    _client = new OAuth2Client(clientId);
  }
  const ticket = await _client.verifyIdToken({ idToken: token, audience: clientId });
  return ticket.getPayload();
}

export async function isAdmin(request) {
  // Local development bypass.
  if (process.env.ADMIN_DEV === "1") return true;

  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  if (clientId && adminEmails().length) {
    const token = getBearerToken(request);
    if (!token) return false;
    try {
      const payload = await verifyGoogleToken(token, clientId);
      if (!payload || payload.email_verified !== true) return false;
      return emailAllowed(payload.email);
    } catch {
      return false;
    }
  }

  // Legacy fallback: Static Web Apps assigned role.
  const p = getPrincipal(request);
  return !!(p && Array.isArray(p.userRoles) && p.userRoles.includes("admin"));
}
