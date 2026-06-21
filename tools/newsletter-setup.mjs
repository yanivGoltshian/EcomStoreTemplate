#!/usr/bin/env node
// One-shot activation for the Brevo newsletter feature.
//
// The newsletter ships OFF. Turning it on is normally three manual owner steps:
//   1. Create a Brevo contact list and copy its List ID.
//   2. Set the SWA app settings BREVO_API_KEY (secret) + BREVO_LIST_ID.
//   3. Flip the admin master toggle ON (commit newsletter-settings.json -> rebuild).
// This script automates all three. It is idempotent and never prints the API key.
//
// USAGE
//   node tools/newsletter-setup.mjs                 # interactive
//   BREVO_API_KEY=xkeysib-... node tools/newsletter-setup.mjs
//   node tools/newsletter-setup.mjs --list-id 7     # use an existing Brevo list
//   node tools/newsletter-setup.mjs --enable --yes  # also go live (commit+push)
//   node tools/newsletter-setup.mjs --config-only   # set SWA settings, stay OFF
//
// FLAGS
//   --api-key <key>     Brevo API key (else $BREVO_API_KEY, else hidden prompt)
//   --list-id <n>       Use an existing Brevo list id instead of creating one
//   --list-name <s>     Name for a newly created list (default "<store> Newsletter")
//   --swa-name <s>      Override auto-discovered Static Web App name
//   --swa-rg <s>        Override auto-discovered resource group
//   --enable            Flip the master switch ON (edits JSON, commits, pushes)
//   --config-only       Do Brevo + SWA settings only; never touch the toggle
//   --yes / -y          Skip the "go live" confirmation prompt
//   --dry-run           Print what would happen; change nothing
//   --help / -h         Show this help

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import readline from "node:readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const SETTINGS_PATH = join(REPO_ROOT, "src", "data", "newsletter-settings.json");
const NEWSLETTER_LIB = join(REPO_ROOT, "src", "lib", "newsletter.ts");
const SITE_JSON = join(REPO_ROOT, "src", "data", "site.json");

// ---------- tiny output helpers (no deps) ----------
const c = {
  reset: "\x1b[0m", dim: "\x1b[2m", red: "\x1b[31m", green: "\x1b[32m",
  yellow: "\x1b[33m", blue: "\x1b[34m", cyan: "\x1b[36m", bold: "\x1b[1m",
};
const supportsColor = process.stdout.isTTY;
const paint = (col, s) => (supportsColor ? col + s + c.reset : s);
const step = (n, total, msg) => console.log(`\n${paint(c.bold + c.cyan, `[${n}/${total}]`)} ${msg}`);
const ok = (msg) => console.log(`  ${paint(c.green, "✓")} ${msg}`);
const info = (msg) => console.log(`  ${paint(c.blue, "·")} ${msg}`);
const warn = (msg) => console.log(`  ${paint(c.yellow, "!")} ${msg}`);
const fail = (msg) => { console.error(`\n${paint(c.red, "✗ ERROR")} ${msg}`); process.exit(1); };

// ---------- arg parsing ----------
function parseArgs(argv) {
  const out = { _: [] };
  const flags = new Set(["enable", "config-only", "yes", "y", "dry-run", "help", "h"]);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      if (flags.has(key)) out[key] = true;
      else { out[key] = argv[++i]; }
    } else if (a === "-y") out.y = true;
    else if (a === "-h") out.h = true;
    else out._.push(a);
  }
  return out;
}
const args = parseArgs(process.argv.slice(2));
if (args.help || args.h) {
  console.log(readFileSync(fileURLToPath(import.meta.url), "utf8")
    .split("\n").filter((l) => l.startsWith("//")).map((l) => l.slice(3)).join("\n"));
  process.exit(0);
}
const DRY = !!args["dry-run"];
const ENABLE = !!args.enable;
const CONFIG_ONLY = !!args["config-only"];
const ASSUME_YES = !!(args.yes || args.y);
if (ENABLE && CONFIG_ONLY) fail("--enable and --config-only are mutually exclusive.");

// ---------- shell helpers ----------
function run(cmd, cmdArgs, opts = {}) {
  return execFileSync(cmd, cmdArgs, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });
}
function tryRun(cmd, cmdArgs, opts = {}) {
  try { return { ok: true, out: run(cmd, cmdArgs, opts).trim() }; }
  catch (e) { return { ok: false, out: (e.stdout || "") + (e.stderr || ""), err: e }; }
}

// ---------- interactive prompts ----------
function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(question, (a) => { rl.close(); res(a.trim()); }));
}
function askHidden(question) {
  return new Promise((res) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const onData = (ch) => {
      ch = ch + "";
      if (ch === "\n" || ch === "\r" || ch === "\u0004") process.stdin.removeListener("data", onData);
      else process.stdout.write("\x1b[2K\x1b[200D" + question + "*".repeat(rl.line.length));
    };
    process.stdout.write(question);
    process.stdin.on("data", onData);
    rl.question("", (a) => { rl.close(); process.stdout.write("\n"); res(a.trim()); });
  });
}

// ---------- Brevo REST ----------
const BREVO = "https://api.brevo.com/v3";
async function brevo(path, { method = "GET", apiKey, body } = {}) {
  const res = await fetch(BREVO + path, {
    method,
    headers: {
      "api-key": apiKey,
      accept: "application/json",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body (e.g. 204) */ }
  return { status: res.status, ok: res.ok, data };
}

function storeName() {
  try {
    const site = JSON.parse(readFileSync(SITE_JSON, "utf8"));
    return site.name || site.title || site.storeName || "Storefront";
  } catch { return "Storefront"; }
}

// The split-host build sets NEXT_PUBLIC_API_BASE to the SWA origin; the template
// keeps it empty (same-origin). If a hard-coded SWA host is ever baked into
// newsletter.ts we use it to disambiguate; otherwise this returns null and we
// fall back to the single-SWA / --swa-name path.
function swaHostFromRepo() {
  try {
    const lib = readFileSync(NEWSLETTER_LIB, "utf8");
    const m = lib.match(/https?:\/\/([a-z0-9-]+\.azurestaticapps\.net)/i);
    return m ? m[1] : null;
  } catch { return null; }
}

// The branch this repo currently tracks (fallback "main").
function currentBranch() {
  const r = tryRun("git", ["-C", REPO_ROOT, "rev-parse", "--abbrev-ref", "HEAD"]);
  const b = r.ok ? r.out.trim() : "";
  return b && b !== "HEAD" ? b : "main";
}

// ================= main =================
(async () => {
  console.log(paint(c.bold, "\n🟢  Newsletter activation (Brevo + Azure SWA)\n"));
  if (DRY) warn("DRY RUN — no changes will be made.\n");

  const TOTAL = ENABLE ? 5 : 4;

  // ---- 1. preflight ----
  step(1, TOTAL, "Preflight checks");
  if (typeof fetch !== "function") fail("Node 18+ required (global fetch missing).");
  ok(`Node ${process.version}`);

  const azVer = tryRun("az", ["version", "-o", "json"]);
  if (!azVer.ok) fail("Azure CLI ('az') not found. Install it: https://aka.ms/azure-cli");
  const acct = tryRun("az", ["account", "show", "-o", "json"]);
  if (!acct.ok) fail("Not logged into Azure. Run: az login");
  const who = JSON.parse(acct.out);
  ok(`Azure CLI logged in as ${who.user?.name || "unknown"} (sub: ${who.name})`);

  // ---- 2. Brevo API key ----
  step(2, TOTAL, "Brevo API key");
  let apiKey = args["api-key"] || process.env.BREVO_API_KEY || "";
  if (!apiKey) {
    if (!process.stdin.isTTY) fail("No Brevo API key. Pass --api-key or set $BREVO_API_KEY.");
    info("Get one at: https://app.brevo.com/settings/keys/api");
    apiKey = await askHidden("  Paste your Brevo API key: ");
  }
  if (!apiKey) fail("Empty API key.");
  const acctRes = await brevo("/account", { apiKey });
  if (!acctRes.ok) {
    fail(`Brevo rejected the API key (HTTP ${acctRes.status}). ` +
      (acctRes.data?.message ? acctRes.data.message : "Check the key and try again."));
  }
  ok(`Brevo key valid — account: ${acctRes.data?.email || "(ok)"}`);

  // ---- 3. resolve / create the contact list ----
  step(3, TOTAL, "Brevo contact list");
  let listId = args["list-id"] ? Number(args["list-id"]) : null;
  if (listId) {
    const lr = await brevo(`/contacts/lists/${listId}`, { apiKey });
    if (!lr.ok) fail(`Brevo list ${listId} not found (HTTP ${lr.status}).`);
    ok(`Using existing list #${listId} — "${lr.data?.name}" (${lr.data?.totalSubscribers ?? 0} contacts)`);
  } else {
    const listName = args["list-name"] || `${storeName()} Newsletter`;
    // Reuse a list with the same name if it already exists (idempotent).
    const existing = await brevo("/contacts/lists?limit=50&offset=0", { apiKey });
    const match = existing.ok && Array.isArray(existing.data?.lists)
      ? existing.data.lists.find((l) => l.name === listName) : null;
    if (match) {
      listId = match.id;
      ok(`Reusing existing list "${listName}" (#${listId}).`);
    } else if (DRY) {
      info(`Would create Brevo list "${listName}".`);
      listId = 0;
    } else {
      // A list needs a folder. Reuse the first folder, else create one.
      const folders = await brevo("/contacts/folders?limit=10&offset=0", { apiKey });
      let folderId = folders.ok && folders.data?.folders?.[0]?.id;
      if (!folderId) {
        const cf = await brevo("/contacts/folders", { apiKey, method: "POST", body: { name: "Newsletter" } });
        if (!cf.ok) fail(`Could not create a Brevo folder (HTTP ${cf.status}).`);
        folderId = cf.data.id;
      }
      const cl = await brevo("/contacts/lists", { apiKey, method: "POST", body: { name: listName, folderId } });
      if (!cl.ok) fail(`Could not create the Brevo list (HTTP ${cl.status}). ${cl.data?.message || ""}`);
      listId = cl.data.id;
      ok(`Created Brevo list "${listName}" (#${listId}) in folder #${folderId}.`);
    }
  }

  // ---- 4. push secrets to Azure SWA ----
  step(4, TOTAL, "Azure Static Web App settings");
  let swaName = args["swa-name"];
  let swaRg = args["swa-rg"];
  if (!swaName || !swaRg) {
    const list = tryRun("az", ["staticwebapp", "list", "-o", "json"]);
    if (!list.ok) fail("Could not list Static Web Apps. Pass --swa-name and --swa-rg.");
    const apps = JSON.parse(list.out);
    if (!apps.length) fail("No Static Web Apps in this subscription.");
    const host = swaHostFromRepo();
    const picked = (host && apps.find((a) => a.defaultHostname === host)) ||
      (apps.length === 1 ? apps[0] : null);
    if (!picked) fail(`Multiple SWAs found and none match ${host || "(no host hint)"}. Pass --swa-name and --swa-rg.`);
    swaName = picked.name; swaRg = picked.resourceGroup;
  }
  ok(`Target: ${swaName} (resource group ${swaRg})`);

  if (DRY) {
    info(`Would set BREVO_API_KEY (secret) and BREVO_LIST_ID=${listId} on ${swaName}.`);
  } else {
    const setArgs = ["staticwebapp", "appsettings", "set", "--name", swaName,
      "--resource-group", swaRg, "--setting-names",
      `BREVO_API_KEY=${apiKey}`, `BREVO_LIST_ID=${listId}`, "-o", "none"];
    const setRes = tryRun("az", setArgs);
    if (!setRes.ok) fail(`Failed to set SWA app settings:\n${setRes.out}`);
    ok("Set BREVO_API_KEY (secret) and BREVO_LIST_ID on the Static Web App.");
    info("The key is stored only in Azure — never printed or committed here.");
  }

  // ---- 5. (optional) flip the master switch ON ----
  if (!ENABLE) {
    console.log("");
    if (CONFIG_ONLY) {
      ok("Config-only run complete. Feature stays OFF until you enable it.");
    } else {
      warn("Feature is still OFF. Re-run with --enable to go live, " +
        "or flip the toggle in the admin → ניוזלטר tab.");
    }
    summary(listId, false);
    return;
  }

  const branch = currentBranch();
  step(5, TOTAL, "Go live — flip the master switch ON");
  const current = JSON.parse(readFileSync(SETTINGS_PATH, "utf8"));
  const next = { ...current, enabled: true, brevoListId: listId };
  if (current.enabled === true && current.brevoListId === listId) {
    ok("newsletter-settings.json already ON with this list — nothing to commit.");
    summary(listId, true);
    return;
  }

  if (!ASSUME_YES && process.stdin.isTTY) {
    const a = await ask(`  This commits & pushes to live (rebuilds the storefront). Continue? [y/N] `);
    if (!/^y(es)?$/i.test(a)) { warn("Aborted before going live. SWA settings are saved."); summary(listId, false); return; }
  }

  if (DRY) {
    info(`Would write ${JSON.stringify(next)} to newsletter-settings.json, commit, and push to origin/${branch}.`);
    summary(listId, false);
    return;
  }

  writeFileSync(SETTINGS_PATH, JSON.stringify(next, null, 2) + "\n");
  ok("Updated src/data/newsletter-settings.json (enabled:true).");

  // commit + push using the repo's configured git identity
  tryRun("git", ["-C", REPO_ROOT, "add", "src/data/newsletter-settings.json"]);
  const commit = tryRun("git", ["-C", REPO_ROOT,
    "commit", "-m", "Enable newsletter signup (master switch ON)"]);
  if (!commit.ok && !/nothing to commit/.test(commit.out)) fail(`git commit failed:\n${commit.out}`);
  ok("Committed the master-switch change.");

  const push = tryRun("git", ["-C", REPO_ROOT, "push", "origin", branch]);
  if (!push.ok) {
    warn("Automatic push failed — commit is saved locally. Push manually:");
    console.log(paint(c.dim, `    git push origin ${branch}`));
    console.log(paint(c.dim, push.out.split("\n").slice(0, 6).join("\n")));
  } else {
    ok(`Pushed to origin/${branch} — your host will rebuild (~1–2 min).`);
  }
  summary(listId, push.ok);
})().catch((e) => fail(e.stack || String(e)));

function summary(listId, live) {
  console.log(paint(c.bold, "\n────────────────────────────────────────"));
  console.log(paint(c.bold, "Summary"));
  console.log(`  Brevo list id : ${paint(c.cyan, String(listId))}`);
  console.log(`  SWA secret    : BREVO_API_KEY ${paint(c.green, "set")}`);
  console.log(`  Feature state : ${live ? paint(c.green, "ON (live)") : paint(c.yellow, "OFF")}`);
  if (live) {
    console.log(paint(c.dim, "\n  Verify in ~2 min: the footer shows the signup form on"));
    console.log(paint(c.dim, "  the storefront, and a real email lands in your Brevo list."));
  } else {
    console.log(paint(c.dim, "\n  To go live later: node tools/newsletter-setup.mjs --enable --yes"));
    console.log(paint(c.dim, "  (or flip the toggle in the admin → ניוזלטר tab)."));
  }
  console.log(paint(c.bold, "────────────────────────────────────────\n"));
}
