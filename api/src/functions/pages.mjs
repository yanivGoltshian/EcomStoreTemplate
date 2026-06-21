import { app } from "@azure/functions";
import { getPages, putPages, putPagesMerge } from "../lib/store.mjs";
import { json, requireAdmin, readBody } from "../lib/http.mjs";

app.http("pages", {
  methods: ["GET", "PUT"],
  authLevel: "anonymous",
  route: "pages",
  handler: async (request) => {
    try {
      if (request.method === "GET") {
        return json(200, await getPages());
      }
      const denied = await requireAdmin(request);
      if (denied) return denied;
      const body = await readBody(request);
      let saved;
      if (body && Array.isArray(body.changedKeys) && body.pages && typeof body.pages === "object") {
        saved = await putPagesMerge(body.pages, body.changedKeys);
      } else {
        saved = await putPages(body);
      }
      return json(200, { ok: true, commit: saved.commit?.sha || null });
    } catch (err) {
      return json(500, { error: String(err.message || err) });
    }
  },
});
