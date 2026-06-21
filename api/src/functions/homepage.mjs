import { app } from "@azure/functions";
import { getHomepage, putHomepage, putHomepageMerge } from "../lib/store.mjs";
import { json, requireAdmin, readBody } from "../lib/http.mjs";

app.http("homepage", {
  methods: ["GET", "PUT"],
  authLevel: "anonymous",
  route: "homepage",
  handler: async (request) => {
    const denied = await requireAdmin(request);
    if (denied) return denied;
    try {
      if (request.method === "GET") {
        return json(200, await getHomepage());
      }
      const body = await readBody(request);
      // Preferred path: the admin sends { homepage, changedKeys } so the server
      // merges only the edited regions into the latest commit (lost-update safe).
      // Legacy path (older client bundle still loaded in a browser): a bare full
      // homepage object → whole-file replace, preserved for backward compat.
      let saved;
      if (body && Array.isArray(body.changedKeys) && body.homepage && typeof body.homepage === "object") {
        saved = await putHomepageMerge(body.homepage, body.changedKeys);
      } else {
        saved = await putHomepage(body);
      }
      return json(200, { ok: true, commit: saved.commit?.sha || null });
    } catch (err) {
      return json(500, { error: String(err.message || err) });
    }
  },
});
