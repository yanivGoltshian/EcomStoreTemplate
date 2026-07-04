"use client";

import Link from "next/link";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/data";
import FallbackImage from "@/components/FallbackImage";

export default function WishlistPage() {
  const { items, count, remove, clear } = useWishlist();
  const { addItem } = useCart();

  if (count === 0) {
    return (
      <div className="container-x py-20 text-center">
        <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-soft text-brand-red">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 20.3 4.7 13a4.6 4.6 0 0 1 6.5-6.5l.8.8.8-.8A4.6 4.6 0 0 1 19.3 13Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-heading">רשימת המשאלות ריקה</h1>
        <p className="mx-auto mt-2 max-w-md text-muted">
          לחצו על ♥ בכל מוצר כדי לשמור אותו כאן ולחזור אליו בקלות בהמשך.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-brand-red px-8 py-3 font-bold text-white transition-colors hover:bg-brand-red-dark"
        >
          חזרה לחנות
        </Link>
      </div>
    );
  }

  return (
    <div className="container-x py-8 md:py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-heading md:text-3xl">
          רשימת המשאלות שלי
          <span className="ms-2 align-middle text-base font-bold text-muted">({count})</span>
        </h1>
        <button
          type="button"
          onClick={clear}
          className="text-sm font-semibold text-muted underline-offset-2 hover:text-brand-red hover:underline"
        >
          ניקוי הרשימה
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <div key={p.id} className="flex h-full flex-col border bg-white text-center">
            <Link href={`/product/${p.id}/`} className="group block overflow-hidden">
              <FallbackImage
                src={p.image || "/images/placeholder.svg"}
                alt={p.name}
                loading="lazy"
                className="mx-auto aspect-square w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
            <div className="flex flex-1 flex-col gap-1.5 px-2 pb-3 pt-1">
              <Link
                href={`/product/${p.id}/`}
                className="clamp-2 min-h-[2.6em] text-[0.82rem] leading-snug text-muted hover:text-brand-red"
              >
                {p.name}
              </Link>
              <div className="mt-auto pt-1">
                {p.price > 0 ? (
                  <span className="text-lg font-extrabold text-brand-red">{formatPrice(p.price)}</span>
                ) : (
                  <span className="text-sm font-bold text-brand-red">לפרטים נוספים</span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                {p.price > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      addItem({ id: p.id, name: p.name, model: p.model, price: p.price, image: p.image })
                    }
                    className="flex-1 rounded-md bg-brand-red px-2 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-red-dark"
                  >
                    🛒 לסל
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  aria-label="הסרה מרשימת המשאלות"
                  title="הסרה"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-line text-muted transition-colors hover:border-brand-red hover:text-brand-red"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
