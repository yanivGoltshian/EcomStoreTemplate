"use client";

import type { Product } from "@/lib/types";
import { useQuickView } from "@/lib/quickview";
import WishlistButton from "@/components/WishlistButton";

export default function CardOverlay({ product }: { product: Product }) {
  const { openQuickView } = useQuickView();

  return (
    <div className="absolute start-2 top-2 z-10 flex flex-col gap-1.5">
      <WishlistButton
        variant="icon"
        product={{
          id: product.id,
          name: product.name,
          model: product.model,
          price: product.price,
          image: product.image,
        }}
      />
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          openQuickView(product);
        }}
        aria-label="הצצה מהירה"
        title="הצצה מהירה"
        className="grid h-8 w-8 place-items-center rounded-full border border-line bg-white/85 text-ink shadow-sm backdrop-blur-sm transition-colors hover:bg-brand-red hover:text-white"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </div>
  );
}
