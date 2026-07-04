"use client";

import { useState } from "react";
import { useWishlist, type WishlistItem } from "@/lib/wishlist";

type Props = {
  product: WishlistItem;
  /** "icon" = bare circular button (product cards / overlays); "chip" = labeled pill (detail pages). */
  variant?: "icon" | "chip";
  className?: string;
};

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-full w-full"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20.3 4.7 13a4.6 4.6 0 0 1 6.5-6.5l.8.8.8-.8A4.6 4.6 0 0 1 19.3 13Z" />
    </svg>
  );
}

export default function WishlistButton({ product, variant = "icon", className = "" }: Props) {
  const { has, toggle } = useWishlist();
  const saved = has(product.id);
  const [pop, setPop] = useState(false);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(product);
    setPop(true);
    window.setTimeout(() => setPop(false), 320);
  }

  const label = saved ? "הסרה מרשימת המשאלות" : "הוספה לרשימת המשאלות";

  if (variant === "chip") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        aria-label={label}
        title={label}
        className={`grid place-items-center gap-1.5 rounded-md border-2 px-4 text-sm font-bold transition-colors [grid-auto-flow:column] ${
          saved
            ? "border-brand-red bg-brand-red text-white"
            : "border-brand-red text-brand-red hover:bg-brand-red hover:text-white"
        } ${className}`}
      >
        <span className={`grid h-4 w-4 place-items-center ${pop ? "wish-pop" : ""}`}>
          <HeartIcon filled={saved} />
        </span>
        {saved ? "שמור ברשימה" : "שמירה"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded-full border border-line bg-white/85 text-brand-red shadow-sm backdrop-blur-sm transition-colors hover:bg-brand-red hover:text-white ${className}`}
    >
      <span className={`grid h-[18px] w-[18px] place-items-center ${pop ? "wish-pop" : ""}`}>
        <HeartIcon filled={saved} />
      </span>
    </button>
  );
}
