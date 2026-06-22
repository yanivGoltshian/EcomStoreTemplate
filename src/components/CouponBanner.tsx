"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { activePublicCoupons } from "@/lib/coupons";

// Thin promo strip on the homepage. Shows the first live public coupon with a
// one-click "copy code" button. Renders nothing when there is no active coupon,
// so the store can simply disable all coupons to hide it.
export default function CouponBanner() {
  const coupon = useMemo(() => activePublicCoupons()[0], []);
  const [copied, setCopied] = useState(false);

  if (!coupon) return null;

  function copy() {
    if (!coupon) return;
    try {
      navigator.clipboard?.writeText(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <section className="container-x mt-4">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-xl border border-brand-red/25 bg-soft px-4 py-3 text-center">
        <span className="text-lg" aria-hidden>
          🎟️
        </span>
        <p className="text-sm font-extrabold text-brand-red md:text-base">{coupon.title}</p>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-2 rounded-md border border-dashed border-brand-red bg-white px-3 py-1.5 text-sm font-bold text-brand-red transition-colors hover:bg-brand-red hover:text-white"
          aria-label={`העתקת קוד קופון ${coupon.code}`}
        >
          <span dir="ltr" className="tracking-wide">
            {coupon.code}
          </span>
          <span className="text-xs font-semibold">{copied ? "✓ הועתק" : "העתקה"}</span>
        </button>
        <Link
          href="/cart/"
          className="text-xs font-semibold text-muted underline-offset-2 hover:text-brand-red hover:underline"
        >
          למימוש בעגלה ›
        </Link>
      </div>
    </section>
  );
}
