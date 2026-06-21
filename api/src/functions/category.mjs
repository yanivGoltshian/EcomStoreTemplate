import { app } from "@azure/functions";
import { updateCategory, deleteCategory } from "../lib/store.mjs";
import { json, requireAdmin, readBody } from "../lib/http.mjs";

// Item: PUT (rename / re-icon) / DELETE a single category by id.
app.http("category", {
  methods: ["PUT", "DELETE"],
  authLevel: "anonymous",
  route: "categories/{id}",
  handler: async (request) => {
    const denied = await requireAdmin(request);
    if (denied) return denied;
    const id = request.params.id;
    try {
      if (request.method === "DELETE") {
        const res = await deleteCategory(id);
        return res.ok ? json(200, res) : json(404, { error: "Not found" });
      }
      const body = await readBody(request);
      const saved = await updateCategory(id, body);
      return saved ? json(200, saved) : json(404, { error: "Not found" });
    } catch (err) {
      return json(500, { error: String(err.message || err) });
    }
  },
});
