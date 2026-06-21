// Zero-dependency local admin harness.
//
// Lets you run the admin panel end-to-end on your machine WITHOUT installing the
// Azure Functions runtime or the SWA CLI. It:
//   * serves /api/* by calling the same store logic the Functions use (local FS
//     backend, so edits hit the real repo files and Next hot-reloads),
//   * fakes /.auth/me with an admin principal,
//   * proxies everything else to the Next dev server on :3000.
//
// Usage:
//   1) terminal A:  npm run dev           (Next dev server on :3000)
//   2) terminal B:  node tools/admin-local.mjs
//   3) open        http://localhost:8787/admin/
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.REPO_ROOT = process.env.REPO_ROOT || path.resolve(__dirname, "..");
process.env.ADMIN_DEV = "1";

const store = await import(path.resolve(__dirname, "../api/src/lib/store.mjs"));

const PORT = Number(process.env.ADMIN_PORT || 8787);
const NEXT_ORIGIN = process.env.NEXT_ORIGIN || "http://localhost:3000";

// When the static export exists we serve it directly (exactly what Azure Static
// Web Apps serves in production — fully hydrated, no dev-server streaming/HMR).
// Otherwise we fall back to proxying the Next dev server on :3000.
const OUT_DIR = path.resolve(__dirname, "../out");
// ADMIN_FORCE_PROXY=1 forces proxy-to-Next mode (live hot reload) even when a
// stale out/ build exists — used by `npm run dev:full`.
const FORCE_PROXY = process.env.ADMIN_FORCE_PROXY === "1";
const SERVE_STATIC = !FORCE_PROXY && fs.existsSync(path.join(OUT_DIR, "index.html"));

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

async function tryFile(res, filePath) {
  try {
    const st = await fsp.stat(filePath);
    if (!st.isFile()) return false;
    const data = await fsp.readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream" });
    res.end(data);
    return true;
  } catch {
    return false;
  }
}

async function serveStatic(req, res, url) {
  // Decode + normalize, block path traversal.
  let pathname = decodeURIComponent(url.pathname);
  const abs = path.normalize(path.join(OUT_DIR, pathname));
  if (!abs.startsWith(OUT_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    return res.end("Forbidden");
  }
  // 1) exact file (assets like /_next/..., /images/..., /favicon.ico)
  if (path.extname(pathname) && (await tryFile(res, abs))) return;
  // 2) directory → index.html (handles trailingSlash routes: /admin/, /product/36189/)
  if (await tryFile(res, path.join(abs, "index.html"))) return;
  // 3) /foo → /foo/index.html (no trailing slash)
  if (await tryFile(res, abs + "/index.html")) return;
  // 4) /foo → /foo.html
  if (await tryFile(res, abs + ".html")) return;
  // 5) SWA-style fallback
  const notFound = path.join(OUT_DIR, "404.html");
  try {
    const data = await fsp.readFile(notFound);
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not found");
  }
}

function send(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

async function handleApi(req, res, url) {
  const seg = url.pathname.replace(/^\/api\//, "").replace(/\/+$/, "").split("/");
  const method = req.method;
  try {
    // /api/site
    if (seg[0] === "site") {
      if (method === "GET") return send(res, 200, await store.getSite());
      if (method === "PUT") {
        await store.putSite(await readJsonBody(req));
        return send(res, 200, { ok: true });
      }
    }
    // /api/homepage
    if (seg[0] === "homepage") {
      if (method === "GET") return send(res, 200, await store.getHomepage());
      if (method === "PUT") {
        // Mirror the deployed Function: when the admin sends { homepage,
        // changedKeys } do an authoritative server-side field merge; otherwise
        // a bare homepage object is a whole-file replace (back-compat).
        const body = await readJsonBody(req);
        if (body && Array.isArray(body.changedKeys) && body.homepage && typeof body.homepage === "object") {
          await store.putHomepageMerge(body.homepage, body.changedKeys);
        } else {
          await store.putHomepage(body);
        }
        return send(res, 200, { ok: true });
      }
    }
    // /api/pages
    if (seg[0] === "pages") {
      if (method === "GET") return send(res, 200, await store.getPages());
      if (method === "PUT") {
        const body = await readJsonBody(req);
        if (body && Array.isArray(body.changedKeys) && body.pages && typeof body.pages === "object") {
          await store.putPagesMerge(body.pages, body.changedKeys);
        } else {
          await store.putPages(body);
        }
        return send(res, 200, { ok: true });
      }
    }
    // /api/categories  and  /api/categories/{id}
    if (seg[0] === "categories") {
      const id = seg[1];
      if (!id) {
        if (method === "GET") return send(res, 200, await store.getCategories());
        if (method === "POST") {
          const created = await store.createCategory(await readJsonBody(req));
          return send(res, 201, created);
        }
      } else {
        if (method === "PUT") {
          const saved = await store.updateCategory(id, await readJsonBody(req));
          return saved ? send(res, 200, saved) : send(res, 404, { error: "Not found" });
        }
        if (method === "DELETE") {
          const r = await store.deleteCategory(id);
          return r.ok ? send(res, 200, r) : send(res, 404, { error: "Not found" });
        }
      }
    }
    // /api/newsletter-settings  (master on/off switch + Brevo list config)
    if (seg[0] === "newsletter-settings" && !seg[1]) {
      const brevoConfigured = !!process.env.BREVO_API_KEY;
      if (method === "GET") {
        const s = await store.getNewsletterSettings();
        return send(res, 200, { ...s, brevoConfigured });
      }
      if (method === "PUT") {
        const saved = await store.putNewsletterSettings(await readJsonBody(req));
        return send(res, 200, { ...saved, brevoConfigured });
      }
    }
    // /api/newsletter-subscribe  (PUBLIC signup; mirrors the SWA Function)
    if (seg[0] === "newsletter-subscribe" && !seg[1]) {
      if (method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
      }
      if (method === "POST") {
        const body = await readJsonBody(req).catch(() => ({}));
        if (body && body.company) return send(res, 200, { ok: true }); // honeypot
        const email = String((body && body.email) || "").trim();
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!valid) return send(res, 400, { error: "כתובת אימייל לא תקינה" });
        const settings = await store.getNewsletterSettings();
        if (!settings.enabled)
          return send(res, 403, { error: "ההרשמה לניוזלטר אינה פעילה" });
        const key = process.env.BREVO_API_KEY;
        if (!key) {
          // No local Brevo key: simulate success so the form flow is testable.
          console.log(`[newsletter-local] would subscribe: ${email}`);
          return send(res, 200, { ok: true, simulated: true });
        }
        try {
          const r = await fetch("https://api.brevo.com/v3/contacts", {
            method: "POST",
            headers: {
              "api-key": key,
              "content-type": "application/json",
              accept: "application/json",
            },
            body: JSON.stringify({
              email,
              listIds: settings.brevoListId ? [settings.brevoListId] : undefined,
              updateEnabled: true,
            }),
          });
          if (r.ok) return send(res, 200, { ok: true });
          const j = await r.json().catch(() => ({}));
          if (j && j.code === "duplicate_parameter")
            return send(res, 200, { ok: true });
          return send(res, 502, { error: "שגיאה בשמירת ההרשמה" });
        } catch {
          return send(res, 502, { error: "שגיאה בשמירת ההרשמה" });
        }
      }
    }
    // /api/upload
    if (seg[0] === "upload" && method === "POST") {
      const result = await store.uploadImage(await readJsonBody(req));
      return send(res, 200, { ok: true, ...result });
    }
    // /api/import-products (bulk Excel import → single write)
    if (seg[0] === "import-products" && method === "POST") {
      const body = await readJsonBody(req);
      if (!Array.isArray(body.products))
        return send(res, 400, { error: "Expected { products: [...] }." });
      const result = await store.bulkImportProducts({
        products: body.products,
        mode: body.mode,
      });
      return send(res, 200, result);
    }
    // /api/products  and  /api/products/{id}
    if (seg[0] === "products") {
      const id = seg[1];
      if (!id) {
        if (method === "GET") {
          const q = (url.searchParams.get("q") || "").trim().toLowerCase();
          const category = Number(url.searchParams.get("category") || 0);
          let products = await store.getProducts();
          if (q)
            products = products.filter(
              (p) =>
                p.name.toLowerCase().includes(q) ||
                String(p.model || "").toLowerCase().includes(q) ||
                String(p.id).includes(q)
            );
          if (category)
            products = products.filter(
              (p) => Array.isArray(p.categoryIds) && p.categoryIds.includes(category)
            );
          return send(res, 200, { count: products.length, products });
        }
        if (method === "POST") {
          const body = await readJsonBody(req);
          delete body.id;
          return send(res, 201, await store.saveProduct(body));
        }
      } else {
        if (method === "GET") {
          const p = await store.getProduct(id);
          return p ? send(res, 200, p) : send(res, 404, { error: "Not found" });
        }
        if (method === "PUT") {
          const body = await readJsonBody(req);
          body.id = Number(id);
          return send(res, 200, await store.saveProduct(body));
        }
        if (method === "DELETE") {
          const r = await store.deleteProduct(id);
          return r.ok ? send(res, 200, r) : send(res, 404, { error: "Not found" });
        }
      }
    }
    return send(res, 404, { error: `No route for ${method} ${url.pathname}` });
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
}

function proxyToNext(req, res) {
  const target = new URL(req.url, NEXT_ORIGIN);
  const proxyReq = http.request(
    target,
    { method: req.method, headers: { ...req.headers, host: target.host } },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );
  proxyReq.on("error", (err) => {
    res.writeHead(502, { "Content-Type": "text/plain" });
    res.end(`Proxy error (is 'npm run dev' running on ${NEXT_ORIGIN}?): ${err.message}`);
  });
  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // fake SWA auth endpoints for local dev
  if (url.pathname === "/.auth/me") {
    return send(res, 200, {
      clientPrincipal: {
        identityProvider: "dev",
        userId: "local-admin",
        userDetails: "local-admin",
        userRoles: ["anonymous", "authenticated", "admin"],
      },
    });
  }
  if (url.pathname.startsWith("/.auth/")) {
    res.writeHead(302, { Location: "/admin/" });
    return res.end();
  }

  if (url.pathname.startsWith("/api/")) return handleApi(req, res, url);
  if (SERVE_STATIC) return serveStatic(req, res, url);
  return proxyToNext(req, res);
});

server.listen(PORT, () => {
  console.log(`\n  Admin harness ready:  http://localhost:${PORT}/admin/`);
  console.log(`  Serving:              ${SERVE_STATIC ? `static export (${OUT_DIR})` : `proxy → ${NEXT_ORIGIN}`}`);
  console.log(`  Repo root:            ${process.env.REPO_ROOT}\n`);
  if (!SERVE_STATIC) console.log(`  (no out/ build found — run 'npm run build' for a production-faithful test)\n`);
});
