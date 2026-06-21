#!/usr/bin/env node
/**
 * EcomStoreTemplate — interactive setup wizard.
 *
 *   npm run setup
 *
 * Collects everything needed to turn this template into YOUR store and writes:
 *   • src/data/site.json          — storefront identity, contact, theme, SEO
 *   • public/admin-auth.json      — Google OAuth client id (admin login, client side)
 *   • api/local.settings.json     — admin write-API settings for local dev
 *   • .env                        — same values for the local admin harness
 *
 * Zero dependencies (Node built-ins only). Safe to re-run — existing values are
 * offered as defaults. Nothing is written until you confirm at the end.
 *
 * It will also OFFER to open your browser at the right moments so you can create
 * the Google OAuth client, a GitHub token, and a Search Console property.
 */

import { createInterface } from "node:readline/promises";
import { stdin, stdout, platform, exit } from "node:process";
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);

// ── tiny ANSI helpers ───────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  blue: "\x1b[34m", green: "\x1b[32m", yellow: "\x1b[33m", red: "\x1b[31m", cyan: "\x1b[36m",
};
const b = (s) => `${c.bold}${s}${c.reset}`;
const dim = (s) => `${c.dim}${s}${c.reset}`;
const ok = (s) => `${c.green}${s}${c.reset}`;
const warn = (s) => `${c.yellow}${s}${c.reset}`;
const head = (s) => `\n${c.bold}${c.blue}${s}${c.reset}\n${dim("─".repeat(Math.min(60, s.length + 4)))}`;

if (!stdin.isTTY) {
  console.error(c.red + "setup must be run in an interactive terminal." + c.reset);
  console.error("Run:  npm run setup");
  exit(1);
}

const rl = createInterface({ input: stdin, output: stdout });

async function ask(question, def = "") {
  const suffix = def ? ` ${dim(`[${def}]`)}` : "";
  const a = (await rl.question(`${question}${suffix}: `)).trim();
  return a || def;
}
async function askRequired(question, def = "") {
  for (;;) {
    const a = await ask(question, def);
    if (a) return a;
    console.log(warn("  required — please enter a value."));
  }
}
async function confirm(question, def = true) {
  const a = (await rl.question(`${question} ${dim(def ? "[Y/n]" : "[y/N]")}: `)).trim().toLowerCase();
  if (!a) return def;
  return a === "y" || a === "yes";
}
async function choice(question, options, def) {
  console.log(question);
  options.forEach((o, i) => console.log(`  ${b(String(i + 1))}) ${o.label}`));
  const defIdx = options.findIndex((o) => o.value === def);
  for (;;) {
    const a = await ask("  choose", String(defIdx + 1));
    const n = parseInt(a, 10);
    if (n >= 1 && n <= options.length) return options[n - 1].value;
    console.log(warn("  enter a number from the list."));
  }
}
function openUrl(url) {
  const cmd = platform === "darwin" ? "open" : platform === "win32" ? "cmd" : "xdg-open";
  const args = platform === "win32" ? ["/c", "start", "", url] : [url];
  try { spawn(cmd, args, { stdio: "ignore", detached: true }).unref(); } catch { /* ignore */ }
}
async function maybeOpen(label, url) {
  console.log(dim(`  ${label}:`));
  console.log(`  ${c.cyan}${url}${c.reset}`);
  if (await confirm("  open this in your browser now?", true)) openUrl(url);
}
const digits = (s) => (s || "").replace(/\D/g, "");

// ── load existing config as defaults (idempotent re-run) ────────────────────
const readJson = (file, fallback) => {
  try { return existsSync(p(file)) ? JSON.parse(readFileSync(p(file), "utf8")) : fallback; }
  catch { return fallback; }
};
const site = readJson("src/data/site.json", {});
const adminAuth = readJson("public/admin-auth.json", { googleClientId: "" });

console.log(`${c.bold}${c.blue}
╔══════════════════════════════════════════════════════════╗
║          EcomStoreTemplate — store setup wizard          ║
╚══════════════════════════════════════════════════════════╝${c.reset}`);
console.log(dim("Press Enter to accept the [default]. Re-run anytime — your answers persist.\n"));

// ── 1. Store identity ───────────────────────────────────────────────────────
console.log(head("1 · Store identity"));
site.name = await askRequired("Store name (display, your language)", site.name || "My Store");
site.nameEn = await ask("Store name in English (Latin, for SEO/og)", site.nameEn || site.name);
site.legalName = await ask("Legal / registered business name", site.legalName || site.name);
site.tagline = await ask("Short tagline", site.tagline || "");
site.vatId = await ask("Business / VAT / tax ID (optional)", site.vatId || "");

// ── 2. Language & region ────────────────────────────────────────────────────
console.log(head("2 · Language & text direction"));
const lang = await choice("Primary language / direction:", [
  { label: "Hebrew — RTL (he-IL)", value: "he" },
  { label: "Arabic — RTL (ar)", value: "ar" },
  { label: "English — LTR (en-US)", value: "en" },
  { label: "Other / custom", value: "custom" },
], site.lang || "he");
if (lang === "custom") {
  site.lang = await askRequired("  language code (e.g. fr)", site.lang || "en");
  site.dir = (await choice("  text direction:", [
    { label: "ltr (left-to-right)", value: "ltr" },
    { label: "rtl (right-to-left)", value: "rtl" },
  ], site.dir || "ltr"));
  site.locale = await askRequired("  locale (e.g. fr-FR)", site.locale || `${site.lang}-${site.lang.toUpperCase()}`);
} else {
  const presets = { he: ["he", "rtl", "he-IL"], ar: ["ar", "rtl", "ar"], en: ["en", "ltr", "en-US"] };
  [site.lang, site.dir, site.locale] = presets[lang];
}

// ── 3. Domain & SEO ─────────────────────────────────────────────────────────
console.log(head("3 · Domain & SEO"));
site.url = await askRequired("Canonical site URL", site.url && site.url !== "https://example.com" ? site.url : "https://your-store.example.com");
site.deployUrl = await ask("Deploy URL (usually same as canonical)", site.deployUrl && site.deployUrl !== "https://example.com" ? site.deployUrl : site.url);
site.description = await ask("Meta description (optional)", site.description || "");

console.log(dim("\n  Google Search Console proves you own the domain (improves indexing)."));
if (await confirm("  set up a Search Console verification token now?", false)) {
  await maybeOpen("Google Search Console", "https://search.google.com/search-console");
  console.log(dim('  Add a URL-prefix property for your URL, pick "HTML tag", copy the content="…" value.'));
  site.googleSiteVerification = await ask("  verification token (content value)", site.googleSiteVerification || "");
} else {
  site.googleSiteVerification = site.googleSiteVerification || "";
}

// ── 4. Theme ────────────────────────────────────────────────────────────────
console.log(head("4 · Brand theme"));
console.log(dim("  Primary color drives buttons, links, header accents and the PWA theme."));
let primary = site.theme?.primary || "#2563eb";
for (;;) {
  const v = await ask("Primary color (hex)", primary);
  if (/^#?[0-9a-fA-F]{6}$/.test(v)) { primary = v.startsWith("#") ? v : `#${v}`; break; }
  console.log(warn("  enter a 6-digit hex color, e.g. #2563eb"));
}
site.theme = { primary };
if (site.logo) site.logo.alt = site.name; else site.logo = { image: "/images/brand/logo.png", alt: site.name };

// ── 5. Contact & social ─────────────────────────────────────────────────────
console.log(head("5 · Contact & social"));
site.phone = await ask("Phone (display)", site.phone && site.phone !== "00-0000000" ? site.phone : "");
site.phoneRaw = digits(site.phone) || site.phoneRaw || "";
const waIntl = await ask("WhatsApp number (international digits, e.g. 15551234567)", site.whatsapp && site.whatsapp !== "972500000000" ? site.whatsapp : "");
site.whatsapp = digits(waIntl);
site.whatsappDisplay = await ask("WhatsApp (display format)", site.whatsappDisplay && site.whatsappDisplay !== "050-000-0000" ? site.whatsappDisplay : (site.phone || ""));
site.email = await ask("Public email (optional)", site.email || "");
site.facebook = await ask("Facebook page username/URL (optional)", site.facebook || "");
site.instagram = await ask("Instagram handle/URL (optional)", site.instagram || "");

// ── 6. Address ──────────────────────────────────────────────────────────────
console.log(head("6 · Business address"));
site.address = site.address || {};
site.address.street = await ask("Street", site.address.street && !/לדוגמה|Example/.test(site.address.street) ? site.address.street : "");
site.address.city = await ask("City", site.address.city && !/תל אביב|Tel Aviv/.test(site.address.city) ? site.address.city : "");
site.address.postalCode = await ask("Postal code (optional)", site.address.postalCode || "");
site.address.country = await ask("Country code (ISO, e.g. IL/US)", site.address.country || "IL");
site.address.streetEn = site.address.streetEn || site.address.street;
site.address.cityEn = site.address.cityEn || site.address.city;
site.address.full = [site.address.street, site.address.city].filter(Boolean).join(", ");

// ── 7. Admin access (Google login) ──────────────────────────────────────────
console.log(head("7 · Admin login (Google Sign-In)"));
console.log(dim("  The admin panel is protected by Google Sign-In + an email allowlist."));
console.log(dim("  You need an OAuth 2.0 Web client id from Google Cloud Console."));
if (await confirm("  create / view your Google OAuth client now?", true)) {
  await maybeOpen("Google Cloud — Credentials", "https://console.cloud.google.com/apis/credentials");
  console.log(dim("  Create Credentials → OAuth client ID → Web application."));
  console.log(dim(`  Add Authorized JavaScript origins: ${site.deployUrl}  and  http://localhost:8787`));
}
adminAuth.googleClientId = await ask("Google OAuth Web client id (…apps.googleusercontent.com)", adminAuth.googleClientId || "");
const adminEmails = await ask("Admin emails allowed to sign in (comma-separated)", site._adminEmails || "");

console.log(dim("\n  Split-host (optional): if your PUBLIC site and ADMIN run on different"));
console.log(dim("  hosts, set the admin host so the public copy bounces admins to it."));
site.adminHost = await ask("  admin host (blank = single host)", site.adminHost || "");

// ── 8. Content repo & deployment (GitHub) ───────────────────────────────────
console.log(head("8 · Content repository (admin saves commit here)"));
console.log(dim("  Admin edits are committed as JSON/images to a GitHub repo, which"));
console.log(dim("  triggers a rebuild. Needs a fine-grained PAT with Contents: read & write."));
const ghRepo = await ask("GitHub repo (owner/name)", process.env.GITHUB_REPO || "your-username/your-store-repo");
const ghBranch = await ask("Deploy branch", process.env.GITHUB_BRANCH || "main");
let ghToken = "";
if (await confirm("  create a fine-grained GitHub token now?", true)) {
  await maybeOpen("GitHub — new fine-grained token", "https://github.com/settings/personal-access-tokens/new");
  console.log(dim(`  Repository access: only "${ghRepo}".  Permissions → Contents: Read and write.`));
}
ghToken = await ask("  paste the token (leave blank to fill in later)", "");

// ── 9. Analytics (optional) ─────────────────────────────────────────────────
console.log(head("9 · Analytics (optional)"));
console.log(dim("  Google Analytics 4 measurement id (G-XXXXXXXXXX). Leave blank to disable."));
site.analytics = site.analytics || {};
site.analytics.googleAnalyticsId = await ask("GA4 measurement id", site.analytics.googleAnalyticsId || "");

// ── Summary & write ─────────────────────────────────────────────────────────
delete site._adminEmails;
console.log(head("Review"));
const summary = [
  ["Store", `${site.name} (${site.nameEn})`],
  ["Language", `${site.lang} / ${site.dir} / ${site.locale}`],
  ["URL", site.url],
  ["Theme", site.theme.primary],
  ["Phone / WhatsApp", `${site.phone || "—"} / ${site.whatsapp || "—"}`],
  ["Address", site.address.full || "—"],
  ["Google client id", adminAuth.googleClientId ? adminAuth.googleClientId.slice(0, 18) + "…" : warn("(empty)")],
  ["Admin emails", adminEmails || warn("(empty)")],
  ["GitHub repo / branch", `${ghRepo} @ ${ghBranch}`],
  ["GitHub token", ghToken ? ok("provided") : warn("(fill in later)")],
  ["GA4 id", site.analytics.googleAnalyticsId || dim("(disabled)")],
];
for (const [k, v] of summary) console.log(`  ${b(k.padEnd(22))} ${v}`);

console.log("");
if (!(await confirm("Write these files now?", true))) {
  console.log(warn("\nNothing written. Re-run `npm run setup` anytime."));
  rl.close(); exit(0);
}

// site.json
writeFileSync(p("src/data/site.json"), JSON.stringify(site, null, 2) + "\n");
// public/admin-auth.json
writeFileSync(p("public/admin-auth.json"), JSON.stringify({ googleClientId: adminAuth.googleClientId }, null, 2) + "\n");
// api/local.settings.json
const localSettings = {
  IsEncrypted: false,
  Values: {
    FUNCTIONS_WORKER_RUNTIME: "node",
    AzureWebJobsStorage: "",
    GOOGLE_CLIENT_ID: adminAuth.googleClientId,
    ADMIN_EMAILS: adminEmails,
    GITHUB_TOKEN: ghToken,
    GITHUB_REPO: ghRepo,
    GITHUB_BRANCH: ghBranch,
    ADMIN_DEV: "0",
  },
  Host: { CORS: "*" },
};
writeFileSync(p("api/local.settings.json"), JSON.stringify(localSettings, null, 2) + "\n");
// .env (local harness; ADMIN_DEV=1 to bypass Google locally)
const env = [
  "# Generated by `npm run setup`. Local development only — do NOT commit.",
  `GOOGLE_CLIENT_ID=${adminAuth.googleClientId}`,
  `ADMIN_EMAILS=${adminEmails}`,
  `GITHUB_TOKEN=${ghToken}`,
  `GITHUB_REPO=${ghRepo}`,
  `GITHUB_BRANCH=${ghBranch}`,
  "ADMIN_DEV=1",
  "REPO_ROOT=.",
  "ADMIN_PORT=8787",
  "NEXT_ORIGIN=http://localhost:3000",
  "",
].join("\n");
writeFileSync(p(".env"), env);

console.log(ok("\n✓ Wrote: src/data/site.json, public/admin-auth.json, api/local.settings.json, .env\n"));
console.log(b("Next steps:"));
console.log(`  • Replace placeholder images in ${c.cyan}public/images/${c.reset} (logo, hero, og-image, favicon) — or upload via the admin.`);
console.log(`  • Run the storefront:        ${c.cyan}npm run dev${c.reset}   → http://localhost:3000`);
console.log(`  • Run the admin offline:     ${c.cyan}npm run dev:api${c.reset} → http://localhost:8787/admin/`);
console.log(`  • Build static export:       ${c.cyan}npm run build${c.reset}  → ./out`);
console.log(`  • Deploy: see ${c.cyan}README.md${c.reset} (Azure Static Web Apps + Vercel, ~$0/mo).`);
if (!ghToken || !adminAuth.googleClientId || !adminEmails) {
  console.log(warn("\n⚠ Some auth/deploy values are blank — fill them in before deploying the admin."));
}
console.log("");
rl.close();
