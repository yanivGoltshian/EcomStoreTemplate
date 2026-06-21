import { app } from "@azure/functions";
import {
  getNewsletterSettings,
  putNewsletterSettings,
} from "../lib/store.mjs";
import { json, requireAdmin, readBody } from "../lib/http.mjs";

// Master on/off switch + Brevo list config for the newsletter. GET current state,
// PUT new state ({ enabled: boolean, brevoListId: number|null }). Admin-only — the
// public storefront reads the committed JSON at build time, it never calls this.
// GET also reports whether the secret BREVO_API_KEY is present in the environment
// (a boolean status only — the key itself is NEVER returned to the client).
app.http("newsletter-settings", {
  methods: ["GET", "PUT"],
  authLevel: "anonymous",
  route: "newsletter-settings",
  handler: async (request) => {
    const denied = await requireAdmin(request);
    if (denied) return denied;
    try {
      if (request.method === "GET") {
        const settings = await getNewsletterSettings();
        return json(200, {
          ...settings,
          brevoConfigured: !!process.env.BREVO_API_KEY,
        });
      }
      const body = await readBody(request);
      const saved = await putNewsletterSettings(body);
      return json(200, {
        ...saved,
        brevoConfigured: !!process.env.BREVO_API_KEY,
      });
    } catch (err) {
      return json(500, { error: String(err.message || err) });
    }
  },
});
