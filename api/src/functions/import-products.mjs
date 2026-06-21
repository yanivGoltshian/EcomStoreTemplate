import { app } from "@azure/functions";
import { bulkImportProducts } from "../lib/store.mjs";
import { json, requireAdmin, readBody } from "../lib/http.mjs";

// Bulk product import from the admin Excel round-trip. POST a parsed product
// array; the store validates + normalises every row and writes products.json
// in a SINGLE commit (never one-commit-per-row). A distinct route prefix
// ("import-products") avoids clashing with the "products/{id}" route.
app.http("import-products", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "import-products",
  handler: async (request) => {
    const denied = await requireAdmin(request);
    if (denied) return denied;
    try {
      const body = await readBody(request);
      if (!Array.isArray(body.products)) {
        return json(400, { error: "Expected { products: [...] }." });
      }
      const result = await bulkImportProducts({
        products: body.products,
        mode: body.mode,
      });
      return json(200, result);
    } catch (err) {
      return json(500, { error: String(err.message || err) });
    }
  },
});
