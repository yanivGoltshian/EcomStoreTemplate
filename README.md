# EcomStoreTemplate

A reusable, **~$0/month** storefront + self-hosted admin CMS. Clone it, run one setup
wizard, and you have a fast static e‑commerce/catalog site with a real admin panel for
editing products, prices, images, categories, the homepage hero/promos, and legal pages.

It ships fully internationalized (LTR/RTL, any language) with a generic placeholder catalog
so the template runs out of the box.

---

## How it works (the core trick)

**There is no database.** All content lives as **JSON files committed in this Git repo**
(`src/data/*.json`) and the site is a **static export**. The admin panel saves content by
**committing back to the repo through the GitHub API**; each commit triggers a rebuild. That
is why it is free, fast, versioned, and trivially backed up.

```
                         ┌─────────────────────────────────────────┐
                         │              GitHub repo                 │
                         │  src/data/*.json   (the "database")      │
                         │  public/images/**  (product/banner files)│
                         └───────▲───────────────────────┬──────────┘
        commit content          │                        │ push triggers builds
        via GitHub API          │                        │
                         ┌───────┴────────┐      ┌────────▼─────────┐   ┌──────────────┐
   admin user  ───────▶  │ Admin CMS +    │      │  Public site CI  │   │  Public site │
   (Google login)        │ write API      │      │  (static build)  │──▶│  (CDN, fast) │
                         │ (Functions)    │      └──────────────────┘   └──────────────┘
                         └────────────────┘
```

Two deploy targets, both on free tiers:

1. **Public site** — static export served by a CDN (e.g. **Vercel** free). Pure HTML/JS/images.
2. **Admin + write API** — the same export plus a tiny serverless API, hosted where you get
   **free managed functions** (e.g. **Azure Static Web Apps** Free tier). The API verifies the
   admin (Google Sign‑In + email allowlist) and commits JSON/images to GitHub.

You can run **both** from this one repo: one workflow deploys to the function host, Vercel
auto‑deploys the public copy. The admin lives at `/admin/` and is `noindex`.

### Cost model

| Concern        | Choice                                          | Cost |
|----------------|-------------------------------------------------|------|
| Public hosting | Static export on CDN (Vercel free)              | $0   |
| Admin + API    | Azure Static Web Apps **Free** (Functions/auth) | $0   |
| Database       | JSON files in Git (no DB)                        | $0   |
| Image storage  | Image files in Git `public/images/`             | $0   |
| Auth           | Google Sign‑In + email allowlist                | $0   |
| Image resize   | In the browser (Canvas) before upload           | $0   |

> Azure SWA Free caps the deployed app at **250 MB**. Keep `out/` lean (the admin
> auto‑optimizes uploaded images). Heavy catalogs may need image discipline or a paid tier.

---

## Quick start

```bash
git clone <your-new-repo-url> my-store
cd my-store
npm install
npm run setup        # interactive wizard — see below
npm run dev          # storefront at http://localhost:3000
```

Requirements: **Node 18+** and npm. The template runs immediately with placeholder data; the
setup wizard personalizes it.

---

## The setup wizard (`npm run setup`)

A zero‑dependency interactive script. It is **safe to re‑run** (your previous answers become
the defaults) and **writes nothing until you confirm** at the end. It collects:

1. **Store identity** — name, English name, legal name, tagline, tax/VAT id.
2. **Language & direction** — Hebrew/Arabic (RTL), English (LTR), or a custom language;
   sets `lang`, `dir`, and `locale` together.
3. **Domain & SEO** — canonical URL, deploy URL, meta description, optional Google Search
   Console verification token (offers to open Search Console).
4. **Brand theme** — primary color (drives buttons, links, header accents, PWA theme color).
5. **Contact & social** — phone, WhatsApp, email, Facebook, Instagram.
6. **Address** — street, city, postal code, country.
7. **Admin login** — Google OAuth Web client id + the email allowlist (offers to open the
   Google Cloud credentials page).
8. **Content repo** — GitHub `owner/repo`, deploy branch, and a fine‑grained PAT (offers to
   open the token‑creation page).
9. **Analytics (optional)** — a GA4 measurement id (`G‑XXXXXXXXXX`); leave blank to disable.

It **opens your browser** at the right moments for the Google OAuth, GitHub token, and Search
Console steps (it cannot fully automate those — you copy the resulting id/token back in).

It writes:

| File                          | Purpose                                              | Committed? |
|-------------------------------|------------------------------------------------------|------------|
| `src/data/site.json`          | Storefront identity, contact, theme, SEO, analytics  | ✅ yes      |
| `public/admin-auth.json`      | Google OAuth client id (read by the admin in browser)| ✅ yes      |
| `api/local.settings.json`     | Admin write‑API settings for local dev               | ❌ ignored  |
| `.env`                        | Same values for the local admin harness              | ❌ ignored  |

> `public/admin-auth.json` contains only the **public** OAuth client id (safe to commit).
> Secrets — the GitHub PAT — go only into `.env` / `api/local.settings.json` (git‑ignored)
> locally, and into your host's app settings in production. **Never commit a token.**

---

## Project structure

```
src/
  app/                 # Next.js App Router pages (home, category, product, search, legal, admin)
  components/          # storefront + admin UI
    admin/             # the admin SPA (tabs: Products, Homepage, Categories, Pages, Import/Export…)
  data/                # ← the "database": JSON content, imported at build time
    site.json          #   identity, contact, theme, SEO, analytics  (setup writes this)
    products.json      #   catalog
    categories.json    #   categories  (+ nav.json, descendants.json derived for the mega‑menu)
    homepage.json      #   hero, promo tiles, sections
    pages.json         #   legal/about/contact page content
  lib/                 # data loaders + types
api/                   # Azure Functions (ESM .mjs) — the admin write API
  src/functions/       #   products, product, homepage, categories, upload, import-products, …
  src/lib/             #   auth, http, github/local backend, store
public/
  images/              # logo, hero banner, og-image, favicon, product/banner images
  admin-auth.json      # public Google client id
scripts/
  setup.mjs            # the setup wizard
  gen-search-index.mjs # prebuild: regenerates the search index from src/data
tools/
  admin-local.mjs      # offline admin harness (serves /api against the local filesystem)
staticwebapp.config.json  # routes + security headers/CSP for Azure SWA
next.config.ts            # static export config (output: "export")
vercel.json               # minimal config for the public Vercel copy
```

---

## Editing content

You have two ways to edit content:

- **Directly in the JSON** under `src/data/` (commit + push → rebuild). Good for bulk/dev edits.
- **Through the admin panel** at `/admin/` (Google login → edit → save → auto‑commit →
  rebuild). Good for the non‑technical owner. Changes go live in ~1–3 minutes.

The admin panel includes: Products (add/edit/delete, price, sale price, image upload with
auto‑resize), Homepage (hero + promo tiles + sections, with safe merge‑on‑save), Categories,
legal Pages, Brand & details (name, theme color, logo, favicon), and **Excel import/export**
of the full catalog.

### Branding & images

Replace the placeholder assets in `public/images/` (or upload via the admin Brand tab):

- `public/images/brand/logo.png` — header logo
- `public/images/banners/hero.jpg` — homepage hero (the Hero has **no fallback** — keep a file here)
- `public/og-image.jpg` — social share image (1200×630)
- `public/favicon.ico`, `public/icon.svg`, `public/apple-icon.png` — site icons (the admin
  Favicon uploader can override these per‑store)
- `public/images/placeholder.svg` — shown for products without an image

### Replacing the placeholder catalog

The template ships a small generic catalog. To load your own data, either edit
`src/data/products.json` + `categories.json` directly, or use the admin **Import/Export** tab:
export the Excel template (with instructions), fill it in, and import. If you are cloning an
existing store, pull its catalog via its API (e.g. WooCommerce/Shopify REST) and normalize
into the JSON shapes, downloading images into `public/images/`.

---

## Running locally

```bash
npm run dev        # storefront only        → http://localhost:3000
npm run dev:api    # admin harness + storefront → http://localhost:8787/admin/
npm run build      # static export           → ./out
```

`npm run dev:api` runs `tools/admin-local.mjs`, which serves the `/api/*` write API against
your **local filesystem** and proxies the Next site — so you can use the full admin offline.
With `ADMIN_DEV=1` (set by the wizard in `.env`) Google login is bypassed locally.

---

## Configuring authentication

### 1. Google Sign‑In (admin login)

1. In **Google Cloud Console → APIs & Services → Credentials**, create an **OAuth client ID →
   Web application**.
2. Add **Authorized JavaScript origins**: your admin host (e.g. the Azure SWA URL) **and**
   `http://localhost:8787` (and `http://localhost:3000` for `npm run dev`).
3. Put the client id where the wizard asks — it writes it to `public/admin-auth.json`
   (browser) **and** to `GOOGLE_CLIENT_ID` (server).
4. The **email allowlist** (`ADMIN_EMAILS`, comma‑separated) decides who may sign in. The
   server verifies the Google ID token **and** that the email is on the list.

> The admin token is sent in a custom **`X-Admin-Token`** header (some managed‑function hosts
> overwrite `Authorization`). This is already handled in the code.

### 2. GitHub token (admin saves)

Create a **fine‑grained PAT** scoped to **only this repo** with **Contents: Read and write**.
Set it as `GITHUB_TOKEN` in your host's app settings (and in `.env` for local). With
`GITHUB_REPO` (`owner/repo`) and `GITHUB_BRANCH`, the API commits content edits back to the
repo, which triggers the rebuild.

---

## Deployment

### Public site — Vercel (free)

1. Import this repo in Vercel. Framework: **Next.js**. It serves the static `out/` export.
2. `.vercelignore` excludes `/api` (the admin Functions don't run on Vercel) — Vercel hosts
   the **public storefront** only.
3. (Optional) Disable Deployment Protection so `*.vercel.app` URLs are public.

### Admin + API — Azure Static Web Apps (free)

1. Create a **Static Web App** (Free plan). App location `/`, API location `api`, output
   location `out`.
2. The GitHub Actions workflow under `.github/workflows/` builds and deploys on push to your
   branch. Add the repo secret **`AZURE_STATIC_WEB_APPS_API_TOKEN`** (from the SWA "Manage
   deployment token").
3. In the SWA **Configuration → Application settings**, set:
   `GOOGLE_CLIENT_ID`, `ADMIN_EMAILS`, `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`.
4. Security headers + CSP live in `staticwebapp.config.json`; `/admin/*` is `noindex`.

### Environment variables / secrets

| Name                              | Where                         | Purpose                                  |
|-----------------------------------|-------------------------------|------------------------------------------|
| `GOOGLE_CLIENT_ID`                | SWA app settings + `.env`     | Verify admin Google ID tokens            |
| `ADMIN_EMAILS`                    | SWA app settings + `.env`     | Comma‑separated admin allowlist          |
| `GITHUB_TOKEN`                    | SWA app settings + `.env`     | Fine‑grained PAT, Contents: RW (secret)  |
| `GITHUB_REPO`                     | SWA app settings + `.env`     | `owner/repo` to commit content to        |
| `GITHUB_BRANCH`                   | SWA app settings + `.env`     | Branch to commit to (e.g. `main`)        |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | GitHub repo secret            | Lets the workflow deploy to SWA          |
| `ADMIN_DEV`                       | `.env` (local only)           | `1` bypasses Google login locally        |
| `REPO_ROOT`, `ADMIN_PORT`, `NEXT_ORIGIN` | `.env` (local only)    | Local admin harness configuration        |

See `.env.example` and `api/local.settings.json.example` for the full annotated lists.

---

## Analytics (optional)

If you provide a **GA4 measurement id** during setup (or set
`site.analytics.googleAnalyticsId` in `src/data/site.json`), the gtag snippet is injected on
every page. Leave it blank to ship **no analytics/trackers at all**. The Content‑Security‑Policy
in `staticwebapp.config.json` already allows the Google Analytics/Tag Manager domains, so they
load only when an id is set and stay inert otherwise.

---

## Security notes

- Only the **public** Google client id is committed (`public/admin-auth.json`). The GitHub PAT
  and other secrets live in git‑ignored files locally and in host app settings in production.
- The admin write API verifies every request (Google token + allowlist) before touching the repo.
- A strict CSP, HSTS, and `X‑Frame‑Options` are set in `staticwebapp.config.json`.
- `.gitignore` already excludes `.env*`, `api/local.settings.json`, `node_modules`, `/out`,
  `/.next`, and `.vercel`.

---

## Scripts reference

| Command           | What it does                                              |
|-------------------|----------------------------------------------------------|
| `npm run setup`   | Interactive store setup wizard (writes config files)     |
| `npm run dev`     | Storefront dev server (`http://localhost:3000`)          |
| `npm run dev:api` | Offline admin harness + storefront (`:8787/admin/`)      |
| `npm run build`   | Static export to `./out` (runs the prebuild search index)|
| `npm run start`   | Serve the production build                               |
| `npm run lint`    | ESLint                                                   |

Built with Next.js (App Router, static export), React, TypeScript, and Tailwind CSS.
