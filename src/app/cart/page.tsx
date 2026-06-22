"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { formatPrice, waLink, site } from "@/lib/data";
import { evalCoupon, couponsEnabled } from "@/lib/coupons";

export default function CartPage() {
  const { items, total, count, couponCode, setCoupon, clearCoupon, setQty, removeItem, clear } =
    useCart();
  const [codeInput, setCodeInput] = useState("");

  const couponEval = useMemo(() => {
    if (!couponsEnabled || !couponCode) return null;
    return evalCoupon(couponCode, {
      lines: items.map((it) => ({ id: it.id, price: it.price, qty: it.qty })),
      subtotal: total,
    });
  }, [couponCode, items, total]);

  const discount = couponEval && couponEval.ok ? couponEval.discount : 0;
  const netTotal = Math.max(0, total - discount);

  function applyCode() {
    const code = codeInput.trim();
    if (!code) return;
    setCoupon(code);
    setCodeInput("");
  }

  function buildWhatsappOrder() {
    const lines = items.map(
      (it) =>
        `• ${it.name}${it.model ? ` (${it.model})` : ""} ×${it.qty} — ${formatPrice(it.price * it.qty)}`,
    );
    const couponLine =
      couponEval && couponEval.ok
        ? `\nקופון ${couponEval.coupon.code}: הנחה ${formatPrice(discount)}\nסה"כ לאחר הנחה: ${formatPrice(netTotal)}`
        : "";
    const msg =
      `שלום ${site.name}, אשמח להזמין:\n` +
      lines.join("\n") +
      `\n\nסה"כ: ${formatPrice(total)}` +
      couponLine +
      `\n\nשם:\nכתובת למשלוח/איסוף:\nטלפון:`;
    return `${waLink}?text=${encodeURIComponent(msg)}`;
  }

  if (count === 0) {
    return (
      <div className="container-x py-20 text-center">
        <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-soft text-brand-red">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="20" r="1.4" />
            <circle cx="17" cy="20" r="1.4" />
            <path d="M3 4h2l2.2 11.2a1 1 0 0 0 1 .8h7.9a1 1 0 0 0 1-.78L19.5 8H6.2" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-heading">עגלת הקניות ריקה</h1>
        <p className="mt-2 text-sm text-muted">עדיין לא הוספתם מוצרים לסל.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-brand-red px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-red-dark"
        >
          המשך לקנייה
        </Link>
      </div>
    );
  }

  return (
    <div className="container-x py-8">
      <div className="section-title mb-6">
        <h1 className="text-2xl font-extrabold text-brand-red">עגלת הקניות</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Items */}
        <div className="space-y-3">
          {items.map((it) => (
            <div
              key={it.id}
              className="flex items-center gap-4 rounded-xl border bg-white p-3"
            >
              <Link href={`/product/${it.id}/`} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.image || "/images/placeholder.svg"}
                  alt={it.name}
                  className="h-20 w-20 rounded-lg border object-contain"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/product/${it.id}/`}
                  className="line-clamp-2 text-sm font-bold text-heading hover:text-brand-red"
                >
                  {it.name}
                </Link>
                {it.model && <p className="mt-0.5 text-xs text-muted">דגם: {it.model}</p>}
                <p className="mt-1 text-sm font-extrabold text-brand-red">{formatPrice(it.price)}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center rounded-md border">
                  <button
                    type="button"
                    onClick={() => setQty(it.id, it.qty - 1)}
                    className="grid h-8 w-8 place-items-center text-lg text-ink hover:text-brand-red"
                    aria-label="הפחתת כמות"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-bold">{it.qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(it.id, it.qty + 1)}
                    className="grid h-8 w-8 place-items-center text-lg text-ink hover:text-brand-red"
                    aria-label="הוספת כמות"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(it.id)}
                  className="text-xs text-muted hover:text-brand-red"
                >
                  הסרה
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={clear}
            className="text-xs text-muted hover:text-brand-red"
          >
            רוקן עגלה
          </button>
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-xl border bg-white p-5 lg:sticky lg:top-28">
          <h2 className="text-base font-extrabold text-heading">סיכום הזמנה</h2>
          <div className="mt-4 flex justify-between text-sm text-ink">
            <span>מוצרים ({count})</span>
            <span className="font-bold">{formatPrice(total)}</span>
          </div>

          {/* Coupon */}
          {couponsEnabled && (
          <div className="mt-4 border-t pt-4">
            {couponEval && couponEval.ok ? (
              <div className="flex items-center justify-between rounded-md bg-soft px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-brand-red">
                    🎟️ קופון {couponEval.coupon.code}
                  </p>
                  <p className="truncate text-[0.7rem] text-muted">{couponEval.coupon.title}</p>
                </div>
                <button
                  type="button"
                  onClick={clearCoupon}
                  className="shrink-0 text-xs text-muted hover:text-brand-red"
                >
                  הסרה
                </button>
              </div>
            ) : (
              <div>
                <label htmlFor="coupon" className="text-xs font-semibold text-heading">
                  קוד קופון
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    id="coupon"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyCode();
                    }}
                    placeholder="הזינו קוד"
                    dir="ltr"
                    className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm focus-visible:border-brand-red"
                  />
                  <button
                    type="button"
                    onClick={applyCode}
                    className="shrink-0 rounded-md bg-brand-red px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-red-dark"
                  >
                    החל
                  </button>
                </div>
                {couponCode && couponEval && !couponEval.ok && (
                  <p className="mt-1.5 text-[0.72rem] text-brand-red">{couponEval.reason}</p>
                )}
              </div>
            )}
          </div>
          )}

          {discount > 0 && (
            <div className="mt-4 flex justify-between text-sm text-ink">
              <span>הנחת קופון</span>
              <span className="font-bold text-brand-red">−{formatPrice(discount)}</span>
            </div>
          )}

          <div className="mt-4 flex items-end justify-between border-t pt-4">
            <span className="text-sm font-bold text-heading">סה״כ לתשלום</span>
            <span className="text-2xl font-extrabold text-brand-red">{formatPrice(netTotal)}</span>
          </div>

          <a
            href={buildWhatsappOrder()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex items-center justify-center gap-2 rounded-md bg-brand-red px-6 py-3 text-base font-bold text-white transition-colors hover:bg-brand-red-dark"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2a9.8 9.8 0 0 0-8.4 14.9L2 22l5.3-1.4A9.8 9.8 0 1 0 12 2Zm0 17.8c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.1.8.8-3-.2-.3A8 8 0 1 1 12 19.8Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3c-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.2.2 1.9 2.9 4.6 4 .6.3 1.1.4 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.2-.2-.2-.4-.3Z" />
            </svg>
            השלמת הזמנה בוואטסאפ
          </a>
          <p className="mt-3 text-center text-[0.72rem] text-muted">
            ההזמנה תישלח אלינו בוואטסאפ ונחזור אליכם לתיאום תשלום ומשלוח/איסוף.
            {discount > 0 ? " ההנחה תאושר בעת סגירת ההזמנה." : ""}
          </p>

          <Link
            href="/"
            className="mt-3 block text-center text-xs font-semibold text-brand-red hover:underline"
          >
            ‹ המשך לקנייה
          </Link>
        </aside>
      </div>
    </div>
  );
}
