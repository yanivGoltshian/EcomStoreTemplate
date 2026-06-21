import { app } from "@azure/functions";
import { getSite, putSite } from "../lib/store.mjs";
import { json, requireAdmin, readBody } from "../lib/http.mjs";

app.http("site", {
  methods: ["GET", "PUT"],
  authLevel: "anonymous",
  route: "site",
  handler: async (request) => {
    const denied = await requireAdmin(request);
    if (denied) return denied;
    try {
      if (request.method === "GET") {
        return json(200, await getSite());
      }
      const body = await readBody(request);
      const saved = await putSite(body);
      return json(200, { ok: true, commit: saved.commit?.sha || null });
    } catch (err) {
      return json(500, { error: String(err.message || err) });
    }
  },
});
