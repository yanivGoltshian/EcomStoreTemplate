import { app } from "@azure/functions";
import { getCoupons, createCoupon } from "../lib/store.mjs";
import { json, requireAdmin, readBody } from "../lib/http.mjs";

// Collection: GET list, POST create.
app.http("coupons", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  route: "coupons",
  handler: async (request) => {
    const denied = await requireAdmin(request);
    if (denied) return denied;
    try {
      if (request.method === "GET") {
        return json(200, await getCoupons());
      }
      const body = await readBody(request);
      const created = await createCoupon(body);
      return json(201, created);
    } catch (err) {
      return json(500, { error: String(err.message || err) });
    }
  },
});
