// Build-time gating + endpoint for the newsletter signup. Mirrors
// src/lib/coupons.ts (when present): a committed JSON file is the master on/off
// switch, read at build time and baked into the bundle. When OFF, the storefront
// renders nothing newsletter-related anywhere.
//
// CROSS-HOST NOTE (the one place this feature needs configuration):
// Newsletter signups are the only PUBLIC dynamic write in this template — every
// other storefront read is static JSON. The form POSTs to the admin Function
// `/api/newsletter-subscribe` (which holds the secret Brevo API key).
//   • SINGLE-HOST deploy (storefront + admin on the same origin, e.g. one Azure
//     Static Web App): leave NEXT_PUBLIC_API_BASE unset → the form calls the
//     SAME-ORIGIN path `/api/newsletter-subscribe`. Nothing else to do.
//   • SPLIT-HOST deploy (public storefront on a static CDN with NO functions,
//     e.g. Vercel, + a separate admin/API host): set NEXT_PUBLIC_API_BASE to the
//     API host origin (e.g. https://<your-app>.azurestaticapps.net) at build time
//     so the form POSTs cross-origin to it. Also add the storefront origin to the
//     Function's ALLOWED_ORIGINS env var (CORS allowlist).
import newsletterSettings from "@/data/newsletter-settings.json";

// Master on/off switch for the WHOLE newsletter feature. Defaults to OFF when the
// flag is missing/malformed — the feature ships disabled and the owner turns it on
// from the admin once Brevo is configured. Only an explicit `true` enables it.
export const newsletterEnabled: boolean =
  (newsletterSettings as { enabled?: boolean })?.enabled === true;

// Empty default = same-origin `/api/...` (works for single-host deploys). Override
// with NEXT_PUBLIC_API_BASE for split-host deploys (see the note above).
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/+$/, "");

// Public endpoint the storefront form POSTs to.
export const NEWSLETTER_ENDPOINT = `${API_BASE}/api/newsletter-subscribe`;
