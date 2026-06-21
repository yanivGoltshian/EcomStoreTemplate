import { app } from "@azure/functions";
import { getProducts, saveProduct } from "../lib/store.mjs";
import { json, requireAdmin, readBody } from "../lib/http.mjs";

// Collection: GET list (optionally ?q= search, ?category= filter), POST create.
app.http("products", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  route: "products",
  handler: async (request) => {
    const denied = await requireAdmin(request);
    if (denied) return denied;
    try {
      if (request.method === "GET") {
        const q = (request.query.get("q") || "").trim().toLowerCase();
        const category = Number(request.query.get("category") || 0);
        let products = await getProducts();
        if (q) {
          products = products.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              String(p.model || "").toLowerCase().includes(q) ||
              String(p.id).includes(q)
          );
        }
        if (category) {
          products = products.filter(
            (p) => Array.isArray(p.categoryIds) && p.categoryIds.includes(category)
          );
        }
        return json(200, { count: products.length, products });
      }
      // POST create
      const body = await readBody(request);
      delete body.id; // force new id assignment
      const created = await saveProduct(body);
      return json(201, created);
    } catch (err) {
      return json(500, { error: String(err.message || err) });
    }
  },
});
