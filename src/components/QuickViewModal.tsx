"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useQuickView } from "@/lib/quickview";
import { site, formatPrice } from "@/lib/data";
import FallbackImage from "@/components/FallbackImage";
import AddToCartButton from "@/components/AddToCartButton";
import WishlistButton from "@/components/WishlistButton";

function plainText(html: string, max = 180): string {
  if (!html) return "";
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

export default function QuickViewModal() {
  const { current, close } = useQuickView();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [close],
  );

  useEffect(() => {
    if (!current) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    // Focus the close button after mount.
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(t);
      restoreFocusRef.current?.focus?.();
    };
  }, [current, onKeyDown]);

  if (!current) return null;

  const p = current;
  const showSale = p.onSale && p.regularPrice > p.price;
  const desc = plainText(p.description);

  return (
    <div
      className="qv-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={p.name}
        dir="rtl"
        className="qv-panel"
      >
        <button
          ref={closeBtnRef}
          type="button"
          onClick={close}
          aria-label="סגירה"
          className="qv-close"
        >
          ✕
        </button>

        <div className="grid gap-4 sm:grid-cols-2">
          <div id="quickview-fly-origin" className="relative grid place-items-center rounded-lg bg-white p-3">
            {showSale && (
              <span className="absolute end-2 top-2 z-10 rounded bg-brand-red px-2 py-0.5 text-[0.7rem] font-bold text-white">
                מבצע
              </span>
            )}
            <FallbackImage
              src={p.image || "/images/placeholder.svg"}
              alt={p.name}
              className="aspect-square w-full max-w-[280px] object-contain"
            />
          </div>

          <div className="flex flex-col">
            <h2 className="text-lg font-extrabold leading-snug text-heading">{p.name}</h2>
            {p.model && <p className="mt-1 text-xs text-muted">דגם: {p.model}</p>}

            <div className="mt-3 flex items-center gap-2">
              {showSale && (
                <span className="text-sm text-muted line-through">{formatPrice(p.regularPrice)}</span>
              )}
              {p.price > 0 ? (
                <span className="text-2xl font-extrabold text-brand-red">{formatPrice(p.price)}</span>
              ) : (
                <span className="text-base font-bold text-brand-red">לפרטים נוספים</span>
              )}
            </div>

            {desc && <p className="mt-3 text-sm leading-relaxed text-ink/80">{desc}</p>}

            <div className="mt-auto pt-5">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <AddToCartButton
                    product={{ id: p.id, name: p.name, model: p.model, price: p.price, image: p.image }}
                    phoneRaw={site.phoneRaw}
                    originId="quickview-fly-origin"
                  />
                </div>
                <WishlistButton
                  variant="icon"
                  product={{ id: p.id, name: p.name, model: p.model, price: p.price, image: p.image }}
                />
              </div>
              <Link
                href={`/product/${p.id}/`}
                onClick={close}
                className="mt-3 inline-block text-sm font-semibold text-brand-red underline-offset-2 hover:underline"
              >
                צפייה מלאה במוצר ←
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
