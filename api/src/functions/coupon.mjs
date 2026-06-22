import { app } from "@azure/functions";
import { updateCoupon, deleteCoupon } from "../lib/store.mjs";
import { json, requireAdmin, readBody } from "../lib/http.mjs";

// Item: PUT (edit) / DELETE a single coupon by id.
app.http("coupon", {
  methods: ["PUT", "DELETE"],
  authLevel: "anonymous",
  route: "coupons/{id}",
  handler: async (request) => {
    const denied = await requireAdmin(request);
    if (denied) return denied;
    const id = request.params.id;
    try {
      if (request.method === "DELETE") {
        const res = await deleteCoupon(id);
        return res.ok ? json(200, res) : json(404, { error: "Not found" });
      }
      const body = await readBody(request);
      const saved = await updateCoupon(id, body);
      return saved ? json(200, saved) : json(404, { error: "Not found" });
    } catch (err) {
      return json(500, { error: String(err.message || err) });
    }
  },
});
