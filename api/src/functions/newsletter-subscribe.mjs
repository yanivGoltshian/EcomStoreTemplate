import { app } from "@azure/functions";
import { getNewsletterSettings } from "../lib/store.mjs";

// PUBLIC newsletter signup endpoint. Unlike every other Function here it is NOT
// admin-guarded — end users on the storefront POST their email to it. For
// SPLIT-HOST deploys (public storefront on a static CDN like Vercel + this API on
// a separate host), the storefront origin differs from the API origin, so the
// endpoint must answer CORS preflight (OPTIONS) and echo an
// Access-Control-Allow-Origin from an allowlist. The allowlist is built from the
// ALLOWED_ORIGINS env var (comma-separated public origins) plus the localhost dev
// ports. For SINGLE-HOST deploys the request is same-origin and CORS is moot.
// The secret BREVO_API_KEY stays server-side and is NEVER returned to the browser.

const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:8787",
  ...String(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function corsHeaders(origin) {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : "";
  const h = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    Vary: "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
  };
  if (allow) h["Access-Control-Allow-Origin"] = allow;
  return h;
}

function reply(status, data, origin) {
  return { status, headers: corsHeaders(origin), body: JSON.stringify(data) };
}

app.http("newsletter-subscribe", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "newsletter-subscribe",
  handler: async (request) => {
    const origin = request.headers.get("origin") || "";

    // CORS preflight.
    if (request.method === "OPTIONS") {
      return { status: 204, headers: corsHeaders(origin) };
    }

    let body = {};
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      return reply(400, { error: "Invalid JSON body." }, origin);
    }

    // Honeypot — bots fill hidden fields. Pretend success, do nothing.
    if (body && typeof body.company === "string" && body.company.trim()) {
      return reply(200, { ok: true }, origin);
    }

    const email = String(body && body.email ? body.email : "").trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email) || email.length > 254) {
      return reply(400, { error: "כתובת אימייל לא תקינה." }, origin);
    }

    // Defense in depth: refuse when the feature is switched OFF, even though the
    // storefront form is gated at build time too.
    const settings = await getNewsletterSettings();
    if (!settings.enabled) {
      return reply(403, { error: "הרשמה לניוזלטר אינה פעילה כעת." }, origin);
    }

    const apiKey = process.env.BREVO_API_KEY;
    const listId = settings.brevoListId || Number(process.env.BREVO_LIST_ID) || 0;
    if (!apiKey || !listId) {
      return reply(500, { error: "הניוזלטר אינו מוגדר. נסו שוב מאוחר יותר." }, origin);
    }

    try {
      const res = await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          email,
          listIds: [listId],
          updateEnabled: true,
        }),
      });

      // 2xx = created/updated. Brevo returns 201 (created) or 204 (updated).
      if (res.ok) {
        return reply(200, { ok: true }, origin);
      }

      // Already a contact on the list → treat as success (idempotent signup).
      let detail = null;
      try {
        detail = await res.json();
      } catch {
        /* non-JSON error body */
      }
      if (detail && detail.code === "duplicate_parameter") {
        return reply(200, { ok: true }, origin);
      }

      return reply(502, { error: "שמירת ההרשמה נכשלה. נסו שוב מאוחר יותר." }, origin);
    } catch {
      return reply(502, { error: "שמירת ההרשמה נכשלה. נסו שוב מאוחר יותר." }, origin);
    }
  },
});
