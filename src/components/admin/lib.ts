import type { Product } from "@/lib/types";

// --- Admin auth token (Google ID token) -----------------------------------
// The admin panel signs in with Google and stores the returned ID token here.
// Every API call carries it in the custom `X-Admin-Token` header; the Azure
// Function verifies it against Google + the email allowlist on the server.
//
// NOTE: we deliberately do NOT use the `Authorization` header. Azure Static Web
// Apps injects its OWN `Authorization: Bearer <HS256 token>` into requests to
// managed functions, which overwrites the client's value — so the Google token
// would never reach the verifier. A custom header passes through untouched.
const TOKEN_KEY = "store-admin-token";
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* sessionStorage unavailable */
  }
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  try {
    authToken = sessionStorage.getItem(TOKEN_KEY);
  } catch {
    authToken = null;
  }
  return authToken;
}

function withAuth(headers: Record<string, string>): Record<string, string> {
  const t = getAuthToken();
  return t ? { ...headers, "x-admin-token": t } : headers;
}

export type AdminAuthConfig = { googleClientId: string };

export async function getAuthConfig(): Promise<AdminAuthConfig> {
  try {
    const r = await fetch("/admin-auth.json", { cache: "no-store" });
    if (r.ok) {
      const j = (await r.json()) as Partial<AdminAuthConfig>;
      return { googleClientId: String(j.googleClientId || "") };
    }
  } catch {
    /* missing/unreachable config → treat as not configured */
  }
  return { googleClientId: "" };
}

async function safeErr(r: Response): Promise<string> {
  try {
    const j = (await r.json()) as { error?: string };
    return j?.error || r.statusText;
  } catch {
    return r.statusText;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  // `no-store` so a reopened admin always refetches live data instead of a
  // browser-cached response (defends against showing a stale edit on reload).
  const r = await fetch(path, {
    headers: withAuth({ accept: "application/json" }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`(${r.status}) ${await safeErr(r)}`);
  return (await r.json()) as T;
}

export async function apiSend<T>(
  path: string,
  method: string,
  body: unknown
): Promise<T> {
  const r = await fetch(path, {
    method,
    headers: withAuth({ "content-type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`(${r.status}) ${await safeErr(r)}`);
  return (await r.json()) as T;
}

export function fileToData(
  file: File
): Promise<{ base64: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error("שגיאה בקריאת הקובץ"));
    fr.onload = () => {
      const res = String(fr.result || "");
      const comma = res.indexOf(",");
      resolve({
        base64: comma >= 0 ? res.slice(comma + 1) : res,
        contentType: file.type || "image/jpeg",
      });
    };
    fr.readAsDataURL(file);
  });
}

// --- Client-side image optimisation ---------------------------------------
// Every image an admin uploads is resized + compressed in the browser BEFORE
// it is sent, so it matches the rest of the catalog exactly: product photos are
// normalised to 700px-wide white-background JPEGs (~20–35KB, same as the
// catalog baseline) and banners to a 2000px cap. Doing this on the
// client keeps the Azure Function tiny (no `sharp`/native deps → no extra cost
// or cold-start) and shrinks the upload payload + the committed asset.
type ImageSpec = { maxW: number; maxH: number; quality: number };

const IMAGE_SPECS: Record<"product" | "banner", ImageSpec> = {
  // Matches the existing 700px product thumbnails (aspect preserved, white bg).
  product: { maxW: 700, maxH: 700, quality: 0.82 },
  // Promo tiles (~600–800px) and the hero (~2000px) all fit under this cap.
  banner: { maxW: 2000, maxH: 2000, quality: 0.85 },
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error("שגיאה בעיבוד התמונה"));
    fr.onload = () => {
      const res = String(fr.result || "");
      const comma = res.indexOf(",");
      resolve(comma >= 0 ? res.slice(comma + 1) : res);
    };
    fr.readAsDataURL(blob);
  });
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("שגיאה בטעינת התמונה"));
    img.src = url;
  });
}

// Resize (never upscale) onto a white canvas and re-encode as JPEG. Returns the
// already-stripped base64 payload + the (always image/jpeg) content type.
export async function processImageFile(
  file: File,
  spec: ImageSpec
): Promise<{ base64: string; contentType: string }> {
  let source: CanvasImageSource;
  let srcW = 0;
  let srcH = 0;
  let bitmap: ImageBitmap | null = null;
  let objectUrl: string | null = null;

  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    source = bitmap;
    srcW = bitmap.width;
    srcH = bitmap.height;
  } catch {
    // Fallback for browsers without createImageBitmap / unsupported types.
    objectUrl = URL.createObjectURL(file);
    const img = await loadImageElement(objectUrl);
    source = img;
    srcW = img.naturalWidth;
    srcH = img.naturalHeight;
  }

  try {
    if (!srcW || !srcH) throw new Error("מימדי תמונה לא תקינים");
    const scale = Math.min(1, spec.maxW / srcW, spec.maxH / srcH);
    const w = Math.max(1, Math.round(srcW * scale));
    const h = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas לא נתמך");
    // Flatten any transparency onto white so PNG/WebP cut-outs match the
    // white-background product/banner look (and JPEG has no alpha channel).
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", spec.quality)
    );
    if (!blob) throw new Error("שגיאה בקידוד התמונה");
    return { base64: await blobToBase64(blob), contentType: "image/jpeg" };
  } finally {
    bitmap?.close();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

// Force a .jpg filename so the server stores the optimised JPEG with a matching
// extension (banner paths are derived from the filename).
function toJpgName(name: string): string {
  const base = (name || "image").replace(/\.[^.]+$/, "");
  return `${base || "image"}.jpg`;
}

// Admin-only image preview source. The admin panel is served from Azure SWA,
// whose deployed `out/` lags a fresh commit by the CI rebuild (~2-3 min). So an
// image just committed via /api/upload 404s on THIS origin until the rebuild
// lands — which made the upload preview look broken. The repo is public, so we
// preview images straight from GitHub raw, which serves the committed bytes
// within seconds. The stored paths (used by the public site) stay relative and
// unchanged; only the admin's <img> preview is rewritten.
// Admin <img> previews must stay same-origin: the Azure SWA admin sets a strict
// CSP (img-src 'self' data:), so cross-origin hosts (e.g. raw.githubusercontent)
// are blocked and render as broken icons. Existing images are already in the
// deployed out/, so the stored relative path loads instantly. A just-uploaded
// image is covered by the local object-URL blob (same component instance) and,
// after a reload during the ~2–3 min publish window, by the "🕓 מתפרסם…"
// onError placeholder. So we return the stored path unchanged.
export function adminPreviewSrc(path: string): string {
  return path || "";
}

export async function uploadImage(
  kind: "product" | "banner",
  file: File,
  opts: Record<string, unknown> = {}
): Promise<string> {
  let payload: { base64: string; contentType: string };
  let filename = file.name;
  try {
    payload = await processImageFile(file, IMAGE_SPECS[kind]);
    filename = toJpgName(file.name);
  } catch {
    // If in-browser processing fails for any reason, fall back to the raw file
    // so an upload never hard-fails.
    payload = await fileToData(file);
  }
  const res = await apiSend<{ path: string }>("/api/upload", "POST", {
    kind,
    base64: payload.base64,
    contentType: payload.contentType,
    filename,
    ...opts,
  });
  return res.path;
}

// Upload a logo / brand image. Unlike product/banner uploads, this does NOT run
// the Canvas JPEG optimiser — that flattens transparency, which would ruin a
// transparent PNG logo. The raw bytes are sent and the server keeps the
// original extension (.png stays .png).
export async function uploadLogo(file: File): Promise<string> {
  const payload = await fileToData(file);
  const res = await apiSend<{ path: string }>("/api/upload", "POST", {
    kind: "brand",
    base64: payload.base64,
    contentType: payload.contentType,
    filename: file.name,
  });
  return res.path;
}

// Normalise an uploaded favicon: scale to fit a square canvas (never upscale),
// centre it (contain — no cropping) on a TRANSPARENT background and encode as
// PNG so alpha is preserved. One 512px square serves the tab favicon, the
// apple-touch icon and the PWA "any" icons (browsers/OS downscale as needed).
export async function processFaviconToPng(
  file: File,
  size = 512
): Promise<{ base64: string; contentType: string }> {
  let source: CanvasImageSource;
  let srcW = 0;
  let srcH = 0;
  let bitmap: ImageBitmap | null = null;
  let objectUrl: string | null = null;

  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    source = bitmap;
    srcW = bitmap.width;
    srcH = bitmap.height;
  } catch {
    objectUrl = URL.createObjectURL(file);
    const img = await loadImageElement(objectUrl);
    source = img;
    srcW = img.naturalWidth;
    srcH = img.naturalHeight;
  }

  try {
    if (!srcW || !srcH) throw new Error("מימדי תמונה לא תקינים");
    const scale = Math.min(1, size / srcW, size / srcH);
    const w = Math.max(1, Math.round(srcW * scale));
    const h = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas לא נתמך");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      source,
      Math.round((size - w) / 2),
      Math.round((size - h) / 2),
      w,
      h
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    if (!blob) throw new Error("שגיאה בקידוד התמונה");
    return { base64: await blobToBase64(blob), contentType: "image/png" };
  } finally {
    if (bitmap) bitmap.close();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

export async function uploadFavicon(file: File): Promise<string> {
  const payload = await processFaviconToPng(file);
  const res = await apiSend<{ path: string }>("/api/upload", "POST", {
    kind: "favicon",
    base64: payload.base64,
    contentType: payload.contentType,
    filename: file.name,
  });
  return res.path;
}

const ils = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

export function formatPrice(n: number): string {
  return ils.format(n || 0);
}

export type ProductList = { count: number; products: Product[] };

export type Principal = {
  clientPrincipal: {
    userId: string;
    userDetails: string;
    identityProvider: string;
    userRoles: string[];
  } | null;
};
