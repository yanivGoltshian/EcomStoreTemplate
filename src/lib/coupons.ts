// Pure, framework-free coupon logic. Safe to import from client components
// (cart, homepage banner) and from build-time code. The coupon data is a JSON
// file committed in the repo (no backend needed for the public storefront) —
// codes are therefore PUBLIC. Real single-use enforcement would need a backend
// (a later phase); for now a coupon is a discount the store honors when the
// order is closed by phone/WhatsApp.
import couponsData from "@/data/coupons.json";
import couponSettings from "@/data/coupon-settings.json";
import { getProductsByCategory } from "@/lib/data";
import type { Coupon } from "@/lib/types";

export const coupons = couponsData as Coupon[];

// Master on/off switch for the WHOLE coupon system. Read at build time from a
// committed JSON file (just like the coupon data itself). When the store owner
// turns this off in the admin, nothing coupon-related is shown anywhere on the
// storefront — no homepage banner, no cart coupon field, no discount — even if
// coupons still exist in coupons.json. Defaults to ON when the flag is missing.
export const couponsEnabled: boolean =
  (couponSettings as { enabled?: boolean })?.enabled !== false;

// A minimal shape any cart line satisfies — keeps this module decoupled from
// the full CartItem type.
export type CouponLine = { id: number; price: number; qty: number };

function endOfDay(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
}

// Is the coupon within its active window right now (ignores visibility).
export function isCouponLive(c: Coupon, now: Date = new Date()): boolean {
  if (!c.active) return false;
  if (c.startsAt) {
    const start = new Date(c.startsAt);
    if (!Number.isNaN(start.getTime()) && start > now) return false;
  }
  if (c.endsAt) {
    const end = endOfDay(c.endsAt);
    if (!Number.isNaN(end.getTime()) && end < now) return false;
  }
  return true;
}

// Coupons that are live AND meant to be shown to shoppers. Returns nothing when
// the master switch is off, so the homepage banner auto-hides.
export function activePublicCoupons(now: Date = new Date()): Coupon[] {
  if (!couponsEnabled) return [];
  return coupons.filter((c) => c.visibility !== "hidden" && isCouponLive(c, now));
}

export function findCouponByCode(code: string): Coupon | undefined {
  const norm = String(code || "").trim().toUpperCase();
  if (!norm) return undefined;
  return coupons.find((c) => c.code.trim().toUpperCase() === norm);
}

// Which cart lines a coupon applies to, given its scope.
function eligibleLines(coupon: Coupon, lines: CouponLine[]): CouponLine[] {
  if (coupon.scope === "products") {
    const set = new Set((coupon.productIds || []).map(Number));
    return lines.filter((l) => set.has(Number(l.id)));
  }
  if (coupon.scope === "category" && coupon.categoryId) {
    const ids = new Set(getProductsByCategory(coupon.categoryId).map((p) => p.id));
    return lines.filter((l) => ids.has(Number(l.id)));
  }
  return lines;
}

export type CouponEval =
  | { ok: true; coupon: Coupon; discount: number; base: number; newTotal: number }
  | { ok: false; reason: string };

// Evaluate a coupon (by code or object) against a cart. `subtotal` is the full
// cart total; the discount is computed on the subtotal of the ELIGIBLE lines.
export function evalCoupon(
  codeOrCoupon: string | Coupon,
  ctx: { lines: CouponLine[]; subtotal: number },
  now: Date = new Date(),
): CouponEval {
  if (!couponsEnabled) return { ok: false, reason: "מערכת הקופונים אינה פעילה" };
  const coupon =
    typeof codeOrCoupon === "string" ? findCouponByCode(codeOrCoupon) : codeOrCoupon;
  if (!coupon) return { ok: false, reason: "קוד קופון לא נמצא" };
  if (!coupon.active) return { ok: false, reason: "הקופון אינו פעיל" };
  if (!isCouponLive(coupon, now)) return { ok: false, reason: "הקופון אינו בתוקף" };

  const min = Math.max(0, Number(coupon.minSubtotal) || 0);
  if (min > 0 && ctx.subtotal < min) {
    return { ok: false, reason: `הקופון תקף מעל ${formatIls(min)}` };
  }

  const elig = eligibleLines(coupon, ctx.lines);
  const base = elig.reduce((s, l) => s + l.price * l.qty, 0);
  if (base <= 0) {
    return { ok: false, reason: "אין בעגלה מוצרים המזכים בקופון זה" };
  }

  let discount =
    coupon.type === "percent"
      ? Math.round((base * (Number(coupon.value) || 0)) / 100)
      : Math.min(Number(coupon.value) || 0, base);
  discount = Math.max(0, Math.min(discount, base));
  if (discount <= 0) return { ok: false, reason: "הקופון אינו מזכה בהנחה על עגלה זו" };

  const newTotal = Math.max(0, ctx.subtotal - discount);
  return { ok: true, coupon, discount, base, newTotal };
}

function formatIls(n: number): string {
  return "₪" + n.toLocaleString("he-IL");
}
