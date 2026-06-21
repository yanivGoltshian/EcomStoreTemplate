// Generates a slim, public search index from the full product catalog.
// Output shape:
//   {
//     products:   [{ id, name, model, price, ..., groupId, groupName, groupIcon }],
//     categories: [{ id, name, count, icon, top }]   // searchable "product lines"
//   }
// Products carry their top-level category (groupId/groupName) so the client can
// render autocomplete results grouped by category. The categories list lets the
// user match a whole product line (group) directly, not just individual items.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const read = (p) => JSON.parse(readFileSync(resolve(root, p), "utf8"));
const products = read("src/data/products.json");
const categories = read("src/data/categories.json");

const byId = new Map(categories.map((c) => [c.id, c]));

// Walk parent chain up to the top-level (isTop) category.
function resolveTop(id) {
  let cur = byId.get(id);
  let guard = 0;
  while (cur && !cur.isTop && cur.parent && byId.has(cur.parent) && guard < 12) {
    cur = byId.get(cur.parent);
    guard += 1;
  }
  return cur && cur.isTop ? cur : null;
}

const productIndex = products.map((p) => {
  // Pick the most relevant top-level category among the product's categories.
  let group = null;
  for (const cid of p.categoryIds ?? []) {
    const top = resolveTop(cid);
    if (top) {
      group = top;
      break;
    }
  }
  // Fallback: first known category, else a generic bucket.
  if (!group) {
    const firstKnown = (p.categoryIds ?? []).map((c) => byId.get(c)).find(Boolean);
    group = firstKnown ?? { id: 0, name: "מוצרים נוספים", icon: "📦" };
  }
  return {
    id: p.id,
    name: p.name,
    model: p.model,
    price: p.price,
    regularPrice: p.regularPrice,
    salePrice: p.salePrice,
    onSale: p.onSale,
    image: p.image,
    inStock: p.inStock,
    groupId: group.id,
    groupName: group.name,
    groupIcon: (group.icon && group.icon.trim()) || "📦",
  };
});

// Searchable product lines: every category that holds products.
const categoryIndex = categories
  .filter((c) => c.count > 0)
  .map((c) => {
    const top = c.isTop ? null : resolveTop(c.id);
    return {
      id: c.id,
      name: c.name,
      count: c.count,
      icon: (c.icon && c.icon.trim()) || (top && top.icon && top.icon.trim()) || "📦",
      top: top && top.id !== c.id ? top.name : "",
    };
  })
  .sort((a, b) => b.count - a.count);

const index = { products: productIndex, categories: categoryIndex };

const outPath = resolve(root, "public/search-index.json");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(index));

console.log(
  `search-index.json written: ${productIndex.length} products, ${categoryIndex.length} categories`
);
