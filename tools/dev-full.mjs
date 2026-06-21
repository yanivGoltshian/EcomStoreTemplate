// One-command full local dev: storefront + admin API together.
//
// Plain `next dev` does NOT serve /api/* (those are Azure Functions in prod),
// so the admin panel throws 404s. This launcher starts BOTH:
//   * Next dev server on :3000 (hot reload)
//   * the zero-dep admin harness on :8787 (serves /api/* + fakes /.auth/me,
//     proxying everything else to Next)
//
// Open  http://localhost:8787/  — the whole site works, admin included.
//
// Usage:  npm run dev:full     (Ctrl-C stops both)
import { spawn } from "node:child_process";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const NEXT_PORT = 3000;
const ADMIN_PORT = 8787;

const children = [];
let shuttingDown = false;

function stopAll(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const c of children) {
    try {
      c.kill("SIGTERM");
    } catch {}
  }
  setTimeout(() => process.exit(code), 300);
}
process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));

function spawnStep(label, cmd, args, extraEnv = {}) {
  const child = spawn(cmd, args, {
    cwd: ROOT,
    env: { ...process.env, ...extraEnv },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const tag = `\x1b[2m[${label}]\x1b[0m `;
  const pipe = (stream, out) => {
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => {
      for (const line of chunk.split("\n")) {
        if (line.trim()) out.write(tag + line + "\n");
      }
    });
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on("exit", (code) => {
    if (!shuttingDown) {
      console.error(`\n[${label}] exited (code ${code}). Shutting everything down.`);
      stopAll(code || 1);
    }
  });
  children.push(child);
  return child;
}

function waitForPort(port, timeoutMs = 60000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get({ host: "localhost", port, path: "/", timeout: 2000 }, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) reject(new Error(`:${port} not ready in ${timeoutMs}ms`));
        else setTimeout(tick, 500);
      });
      req.on("timeout", () => {
        req.destroy();
        if (Date.now() - start > timeoutMs) reject(new Error(`:${port} not ready in ${timeoutMs}ms`));
        else setTimeout(tick, 500);
      });
    };
    tick();
  });
}

console.log("\n  Starting full local dev (storefront + admin API)…\n");

// 1) Next dev server (storefront, hot reload)
spawnStep("next", process.execPath, [path.join(ROOT, "node_modules/next/dist/bin/next"), "dev"]);

// 2) wait for Next, then start the admin harness in proxy mode
try {
  await waitForPort(NEXT_PORT);
} catch (err) {
  console.error("  Next dev did not come up:", err.message);
  stopAll(1);
}

spawnStep("admin", process.execPath, [path.join(__dirname, "admin-local.mjs")], {
  ADMIN_FORCE_PROXY: "1",
  ADMIN_PORT: String(ADMIN_PORT),
  NEXT_ORIGIN: `http://localhost:${NEXT_PORT}`,
});

setTimeout(() => {
  console.log(
    `\n  \x1b[32m✓ Ready.\x1b[0m  Open  \x1b[36mhttp://localhost:${ADMIN_PORT}/\x1b[0m  (admin: /admin/)\n` +
      `    storefront + admin API both work here. Ctrl-C stops both.\n`
  );
}, 1500);
