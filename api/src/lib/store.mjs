// Backend-agnostic content store for the admin panel. Pure logic on top of the
// chosen backend (GitHub in prod, local FS in dev). No Azure Functions imports
// here so the local dev harness can reuse it directly.
import { getBackend } from "./backend.mjs";

const PATHS = {
  site: "src/data/site.json",
  homepage: "src/data/homepage.json",
  pages: "src/data/pages.json",
  products: "src/data/products.json",
  categories: "src/data/categories.json",
  nav: "src/data/nav.json",
  descendants: "src/data/descendants.json",
};

const PRODUCTS_DIR = "public/images/products";
const BANNERS_DIR = "public/images/banners";
const BRAND_DIR = "public/images/brand";

// ---------- site & homepage ----------
export async function getSite() {
  return getBackend().readJSON(PATHS.site);
}
export async function putSite(obj) {
  return getBackend().writeJSON(PATHS.site, obj, "admin: update site settings");
}
export async function getHomepage() {
  return getBackend().readJSON(PATHS.homepage);
}
export async function putHomepage(obj) {
  return getBackend().writeJSON(PATHS.homepage, obj, "admin: update homepage");
}

// Authoritative, server-side field merge — the robust defense against lost
// updates on the homepage. The admin sends the FULL homepage it holds plus the
// list of top-level regions it actually edited this session (`changedKeys`).
// We re-read the very latest committed homepage (the GitHub backend busts the
// edge cache, so this is always current) and overwrite ONLY those regions; every
// other region keeps its freshest server value. This means an admin tab that has
// been open for a while (stale Hero/promo data) can never clobber newer content
// it didn't touch — even if the client's own pre-save refetch failed. Unknown or
// missing keys are ignored, so a malformed `changedKeys` can't wipe data.
export async function putHomepageMerge(incoming, changedKeys) {
  const be = getBackend();
  const fresh = await be.readJSON(PATHS.homepage).catch(() => null);
  const base = fresh && typeof fresh === "object" && !Array.isArray(fresh) ? fresh : {};
  const merged = { ...base };
  const keys = Array.isArray(changedKeys) ? changedKeys : [];
  for (const k of keys) {
    if (incoming && Object.prototype.hasOwnProperty.call(incoming, k)) {
      merged[k] = incoming[k];
    }
  }
  return be.writeJSON(PATHS.homepage, merged, "admin: update homepage");
}

export async function getPages() {
  return getBackend().readJSON(PATHS.pages);
}
export async function putPages(obj) {
  return getBackend().writeJSON(PATHS.pages, obj, "admin: update content pages");
}

export async function putPagesMerge(incoming, changedKeys) {
  const be = getBackend();
  const fresh = await be.readJSON(PATHS.pages).catch(() => null);
  const base = fresh && typeof fresh === "object" && !Array.isArray(fresh) ? fresh : {};
  const merged = { ...base };
  const keys = Array.isArray(changedKeys) ? changedKeys : [];
  for (const k of keys) {
    if (incoming && Object.prototype.hasOwnProperty.call(incoming, k)) {
      merged[k] = incoming[k];
    }
  }
  return be.writeJSON(PATHS.pages, merged, "admin: update content pages");
}

// ---------- categories ----------
export async function getCategories() {
  return getBackend().readJSON(PATHS.categories);
}

// Build a latin/hebrew-friendly slug. Falls back to a stable cat-<id> form.
function slugifyCategory(value, id) {
  const s = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0590-\u05ff]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || `cat-${id}`;
}

// Create a category. A category with no parent becomes a top-level menu line,
// otherwise it is nested under its parent. Keeps nav.json (the curated mega-menu)
// and descendants.json (used to aggregate a top line's products) in sync.
export async function createCategory(input) {
  const be = getBackend();
  const categories = await getCategories();
  const name = String(input.name ?? "").trim();
  if (!name) throw new Error("שם קטגוריה חסר");
  const parent = toNumber(input.parent, 0);
  const icon = String(input.icon ?? "📦");
  const id = categories.reduce((m, c) => Math.max(m, toNumber(c.id)), 0) + 1;
  const isTop = parent === 0;
  const cat = {
    id,
    name,
    slug: slugifyCategory(input.slug ?? name, id),
    parent,
    count: 0,
    icon,
    isTop,
  };
  categories.push(cat);
  await be.writeJSON(PATHS.categories, categories, `admin: create category ${name}`);

  // nav.json — add a top line, or a sub under an existing top line.
  const nav = (await be.readJSON(PATHS.nav).catch(() => [])) || [];
  if (isTop) {
    nav.push({ id, name, slug: cat.slug, icon, count: 0, subs: [] });
  } else {
    const top = nav.find((t) => toNumber(t.id) === parent);
    if (top) {
      top.subs = Array.isArray(top.subs) ? top.subs : [];
      top.subs.push({ id, name, count: 0 });
    }
  }
  await be.writeJSON(PATHS.nav, nav, `admin: nav add ${name}`);

  // descendants.json — every line maps to at least itself; a sub also rolls up
  // into its parent so the parent's category page lists the sub's products.
  const descendants = (await be.readJSON(PATHS.descendants).catch(() => ({}))) || {};
  descendants[String(id)] = [id];
  if (!isTop) {
    const cur = Array.isArray(descendants[String(parent)])
      ? descendants[String(parent)]
      : [parent];
    descendants[String(parent)] = Array.from(new Set([...cur, id]));
  }
  await be.writeJSON(PATHS.descendants, descendants, `admin: descendants add ${name}`);

  return cat;
}

// Rename / re-icon a category. Mirrors the change into nav.json.
export async function updateCategory(id, patch) {
  const be = getBackend();
  const categories = await getCategories();
  const cat = categories.find((c) => String(c.id) === String(id));
  if (!cat) return null;
  if (patch.name != null) cat.name = String(patch.name).trim() || cat.name;
  if (patch.icon != null) cat.icon = String(patch.icon);
  if (patch.slug != null) cat.slug = slugifyCategory(patch.slug, cat.id);
  await be.writeJSON(PATHS.categories, categories, `admin: update category ${cat.id}`);

  const nav = (await be.readJSON(PATHS.nav).catch(() => [])) || [];
  for (const top of nav) {
    if (toNumber(top.id) === toNumber(cat.id)) {
      top.name = cat.name;
      if (patch.icon != null) top.icon = cat.icon;
      if (patch.slug != null) top.slug = cat.slug;
    }
    if (Array.isArray(top.subs)) {
      for (const s of top.subs) {
        if (toNumber(s.id) === toNumber(cat.id)) s.name = cat.name;
      }
    }
  }
  await be.writeJSON(PATHS.nav, nav, `admin: nav update ${cat.id}`);
  return cat;
}

// Delete a category. Children are promoted to top-level so their products are
// never orphaned, the id is stripped from every product, and nav/descendants
// are cleaned up.
export async function deleteCategory(id) {
  const be = getBackend();
  const numId = toNumber(id);
  let categories = await getCategories();
  if (!categories.some((c) => toNumber(c.id) === numId)) {
    return { ok: false, reason: "not_found" };
  }
  categories = categories
    .filter((c) => toNumber(c.id) !== numId)
    .map((c) =>
      toNumber(c.parent) === numId ? { ...c, parent: 0, isTop: true } : c
    );
  await be.writeJSON(PATHS.categories, categories, `admin: delete category ${numId}`);

  // strip the id from products
  const products = await getProducts();
  let changed = false;
  const cleaned = products.map((p) => {
    if (Array.isArray(p.categoryIds) && p.categoryIds.includes(numId)) {
      changed = true;
      return { ...p, categoryIds: p.categoryIds.filter((c) => c !== numId) };
    }
    return p;
  });
  if (changed) {
    await be.writeJSON(
      PATHS.products,
      cleaned,
      `admin: detach products from category ${numId}`
    );
  }

  // nav.json — drop the top line and any matching sub.
  let nav = (await be.readJSON(PATHS.nav).catch(() => [])) || [];
  nav = nav
    .filter((t) => toNumber(t.id) !== numId)
    .map((t) => ({
      ...t,
      subs: Array.isArray(t.subs)
        ? t.subs.filter((s) => toNumber(s.id) !== numId)
        : t.subs,
    }));
  await be.writeJSON(PATHS.nav, nav, `admin: nav remove ${numId}`);

  // descendants.json — drop its own entry and remove it from every roll-up.
  const descendants = (await be.readJSON(PATHS.descendants).catch(() => ({}))) || {};
  delete descendants[String(numId)];
  for (const k of Object.keys(descendants)) {
    if (Array.isArray(descendants[k])) {
      descendants[k] = descendants[k].filter((x) => toNumber(x) !== numId);
    }
  }
  await be.writeJSON(PATHS.descendants, descendants, `admin: descendants remove ${numId}`);

  return { ok: true, id: numId };
}

// ---------- products ----------
export async function getProducts() {
  return getBackend().readJSON(PATHS.products);
}

export async function getProduct(id) {
  const products = await getProducts();
  return products.find((p) => String(p.id) === String(id)) || null;
}

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// Normalise an incoming product payload into the stored shape.
function normalizeProduct(input, id) {
  const regularPrice = toNumber(input.regularPrice ?? input.price, 0);
  const onSale = Boolean(input.onSale);
  const salePrice = onSale
    ? toNumber(input.salePrice ?? input.price, regularPrice)
    : regularPrice;
  const price = onSale ? salePrice : regularPrice;
  const categoryIds = Array.isArray(input.categoryIds)
    ? input.categoryIds.map((c) => toNumber(c)).filter((c) => c > 0)
    : [];
  return {
    id,
    name: String(input.name ?? "").trim(),
    model: String(input.model ?? "").trim(),
    price,
    regularPrice,
    salePrice,
    onSale,
    image: String(input.image ?? `${"/images/products"}/${id}.jpg`),
    categoryIds,
    inStock: input.inStock === undefined ? true : Boolean(input.inStock),
    description: String(input.description ?? ""),
  };
}

function nextId(products) {
  return products.reduce((max, p) => Math.max(max, toNumber(p.id)), 0) + 1;
}

// Create or update. If input.id matches an existing product => update, else create.
export async function saveProduct(input) {
  const products = await getProducts();
  let id = toNumber(input.id, 0);
  const idx = id ? products.findIndex((p) => String(p.id) === String(id)) : -1;

  if (idx === -1) {
    // create
    if (!id) id = nextId(products);
    const product = normalizeProduct(input, id);
    products.push(product);
    products.sort((a, b) => toNumber(b.id) - toNumber(a.id));
    await getBackend().writeJSON(
      PATHS.products,
      products,
      `admin: add product ${id} (${product.name})`
    );
    return product;
  }

  // update — preserve image if caller didn't send one
  const existing = products[idx];
  const merged = normalizeProduct(
    { ...existing, ...input, image: input.image ?? existing.image },
    existing.id
  );
  products[idx] = merged;
  await getBackend().writeJSON(
    PATHS.products,
    products,
    `admin: update product ${existing.id} (${merged.name})`
  );
  return merged;
}

export async function deleteProduct(id) {
  const products = await getProducts();
  const idx = products.findIndex((p) => String(p.id) === String(id));
  if (idx === -1) return { ok: false, reason: "not_found" };
  const [removed] = products.splice(idx, 1);
  await getBackend().writeJSON(
    PATHS.products,
    products,
    `admin: delete product ${id} (${removed.name})`
  );
  // best-effort image cleanup
  if (removed.image && removed.image.startsWith("/images/products/")) {
    await getBackend().deleteFile(`public${removed.image}`).catch(() => {});
  }
  return { ok: true, id };
}

// Bulk import (Excel round-trip). Writes products.json ONCE (a single commit)
// instead of looping saveProduct (one commit per row). Two modes:
//   - "replace": the supplied list BECOMES the whole catalog (deletions honored).
//   - "merge":   update existing ids + add new ones, keep everything else.
// Each row is normalised through normalizeProduct; unknown category ids are
// dropped (with a warning) and blank image cells fall back to the existing image
// or the conventional /images/products/<id>.jpg path (never wiped to "").
export async function bulkImportProducts(input = {}) {
  const incoming = Array.isArray(input.products) ? input.products : [];
  const mode = input.mode === "merge" ? "merge" : "replace";
  const existing = await getProducts();

  let validCatIds = null;
  try {
    const cats = await getCategories();
    validCatIds = new Set(
      cats.map((c) => toNumber(c.id)).filter((n) => n > 0)
    );
  } catch {
    /* categories optional — skip category validation if unavailable */
  }

  const result = {
    mode,
    created: 0,
    updated: 0,
    skipped: 0,
    total: 0,
    warnings: [],
  };

  const byId = new Map(existing.map((p) => [toNumber(p.id), p]));
  let maxId = existing.reduce((m, p) => Math.max(m, toNumber(p.id)), 0);
  for (const row of incoming) {
    maxId = Math.max(maxId, toNumber(row && row.id, 0));
  }

  const finalById = mode === "merge" ? new Map(byId) : new Map();

  let rowNum = 0;
  for (const row of incoming) {
    rowNum++;
    const name = String((row && row.name) ?? "").trim();
    if (!name) {
      result.skipped++;
      result.warnings.push(`שורה ${rowNum}: דילוג — חסר שם מוצר.`);
      continue;
    }

    let id = toNumber(row.id, 0);
    const isCreate = !id || !byId.has(id);
    if (!id) id = ++maxId;
    const base = isCreate ? {} : byId.get(id);

    let catIds = Array.isArray(row.categoryIds)
      ? row.categoryIds.map((c) => toNumber(c)).filter((c) => c > 0)
      : Array.isArray(base.categoryIds)
        ? base.categoryIds
        : [];
    if (validCatIds && validCatIds.size) {
      const unknown = catIds.filter((c) => !validCatIds.has(c));
      if (unknown.length) {
        result.warnings.push(
          `שורה ${rowNum} (${name}): קטגוריות לא מוכרות הוסרו — ${unknown.join(", ")}.`
        );
      }
      catIds = catIds.filter((c) => validCatIds.has(c));
    }

    const rawImg = String(row.image ?? "").trim();
    const image = rawImg || base.image || `/images/products/${id}.jpg`;

    const normalized = normalizeProduct(
      { ...base, ...row, categoryIds: catIds, image },
      id
    );
    finalById.set(id, normalized);
    if (isCreate) result.created++;
    else result.updated++;
  }

  const finalArr = Array.from(finalById.values()).sort(
    (a, b) => toNumber(b.id) - toNumber(a.id)
  );
  result.total = finalArr.length;
  await getBackend().writeJSON(
    PATHS.products,
    finalArr,
    `admin: bulk import products (${mode}, ${result.total} items)`
  );
  return result;
}

// ---------- image uploads ----------
const EXT_BY_TYPE = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function slugifyName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// payload: { kind: "product"|"banner"|"brand"|"favicon", base64, contentType, id?, filename? }
// returns { path: "/images/...", repoPath: "public/images/..." }
export async function uploadImage(payload) {
  const { kind, base64, contentType } = payload;
  if (!base64) throw new Error("Missing image data.");
  const ext = EXT_BY_TYPE[contentType] || "jpg";
  const buffer = Buffer.from(base64, "base64");

  let repoPath;
  let publicPath;
  if (kind === "product") {
    const id = toNumber(payload.id);
    if (!id) throw new Error("Product upload requires an id.");
    publicPath = `/images/products/${id}.${ext}`;
    repoPath = `${PRODUCTS_DIR}/${id}.${ext}`;
  } else if (kind === "banner") {
    const base = slugifyName(payload.filename) || `banner-${Date.now()}`;
    const fname = base.includes(".") ? base : `${base}.${ext}`;
    publicPath = `/images/banners/${fname}`;
    repoPath = `${BANNERS_DIR}/${fname}`;
  } else if (kind === "brand") {
    // Logo / brand assets. Use a fresh timestamped name each upload so the new
    // file gets a new URL (avoids CDN/browser caching the previous logo). Keeps
    // the uploaded extension (e.g. .png) so transparency is preserved.
    const fname = `logo-${Date.now()}.${ext}`;
    publicPath = `/images/brand/${fname}`;
    repoPath = `${BRAND_DIR}/${fname}`;
  } else if (kind === "favicon") {
    // Site favicon / app icon. Timestamped name for cache-busting; keeps the
    // uploaded extension (PNG) so transparency is preserved.
    const fname = `favicon-${Date.now()}.${ext}`;
    publicPath = `/images/brand/${fname}`;
    repoPath = `${BRAND_DIR}/${fname}`;
  } else {
    throw new Error(`Unknown upload kind: ${kind}`);
  }

  await getBackend().writeBinary(repoPath, buffer, `admin: upload ${repoPath}`);
  return { path: publicPath, repoPath };
}
