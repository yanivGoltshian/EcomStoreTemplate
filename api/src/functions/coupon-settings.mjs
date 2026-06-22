import { app } from "@azure/functions";
import { getCouponSettings, putCouponSettings } from "../lib/store.mjs";
import { json, requireAdmin, readBody } from "../lib/http.mjs";

// Master on/off switch for the whole coupon system. GET current state, PUT new
// state ({ enabled: boolean }). Admin-only — the public storefront reads the
// committed JSON at build time, it never calls this endpoint.
app.http("coupon-settings", {
  methods: ["GET", "PUT"],
  authLevel: "anonymous",
  route: "coupon-settings",
  handler: async (request) => {
    const denied = await requireAdmin(request);
    if (denied) return denied;
    try {
      if (request.method === "GET") {
        return json(200, await getCouponSettings());
      }
      const body = await readBody(request);
      const saved = await putCouponSettings(body);
      return json(200, saved);
    } catch (err) {
      return json(500, { error: String(err.message || err) });
    }
  },
});
