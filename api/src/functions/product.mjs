import { app } from "@azure/functions";
import { getProduct, saveProduct, deleteProduct } from "../lib/store.mjs";
import { json, requireAdmin, readBody } from "../lib/http.mjs";

// Item: GET / PUT / DELETE a single product by id.
app.http("product", {
  methods: ["GET", "PUT", "DELETE"],
  authLevel: "anonymous",
  route: "products/{id}",
  handler: async (request) => {
    const denied = await requireAdmin(request);
    if (denied) return denied;
    const id = request.params.id;
    try {
      if (request.method === "GET") {
        const product = await getProduct(id);
        return product ? json(200, product) : json(404, { error: "Not found" });
      }
      if (request.method === "DELETE") {
        const res = await deleteProduct(id);
        return res.ok ? json(200, res) : json(404, { error: "Not found" });
      }
      // PUT update
      const body = await readBody(request);
      body.id = Number(id);
      const saved = await saveProduct(body);
      return json(200, saved);
    } catch (err) {
      return json(500, { error: String(err.message || err) });
    }
  },
});
