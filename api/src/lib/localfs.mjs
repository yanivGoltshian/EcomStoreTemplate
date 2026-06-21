// Local filesystem backend — used for local development (admin-local harness or
// `swa start`). Reads/writes the real repo files so the Next dev server hot-reloads.
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// api/src/lib -> up three levels = repo root (api/ lives at repo root).
const ROOT = process.env.REPO_ROOT
  ? path.resolve(process.env.REPO_ROOT)
  : path.resolve(__dirname, "../../..");

function abs(p) {
  return path.join(ROOT, p);
}

export async function readJSON(p) {
  const text = await fs.readFile(abs(p), "utf8");
  return JSON.parse(text);
}

export async function writeJSON(p, data) {
  await fs.mkdir(path.dirname(abs(p)), { recursive: true });
  await fs.writeFile(abs(p), JSON.stringify(data, null, 2) + "\n", "utf8");
  return { ok: true, path: p };
}

export async function writeBinary(p, buffer) {
  await fs.mkdir(path.dirname(abs(p)), { recursive: true });
  await fs.writeFile(abs(p), buffer);
  return { ok: true, path: p };
}

export async function deleteFile(p) {
  try {
    await fs.unlink(abs(p));
  } catch {
    /* already gone */
  }
  return { ok: true, path: p };
}

export async function exists(p) {
  try {
    await fs.access(abs(p));
    return true;
  } catch {
    return false;
  }
}
