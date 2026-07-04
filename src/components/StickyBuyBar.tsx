"use client";

import { useEffect, useRef, useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import { formatPrice } from "@/lib/data";

type StickyProduct = {
  id: number;
  name: string;
  model: string;
  price: number;
  regularPrice?: number;
  onSale?: boolean;
  image: string;
};

export default function StickyBuyBar({
  product,
  phoneRaw,
  watchId = "main-buy-row",
  originId,
}: {
  product: StickyProduct;
  phoneRaw: string;
  watchId?: string;
  originId?: string;
}) {
  const [visible, setVisible] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = document.getElementById(watchId);
    if (!target) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [watchId]);

  const showSale = !!product.onSale && (product.regularPrice ?? 0) > product.price;

  return (
    <div
      ref={barRef}
      className={`sticky-buy-bar lg:hidden ${visible ? "is-visible" : ""}`}
      aria-hidden={!visible}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-heading">{product.name}</p>
          {product.price > 0 ? (
            <p className="flex items-center gap-2">
              <span className="text-base font-extrabold text-brand-red">{formatPrice(product.price)}</span>
              {showSale && (
                <span className="text-xs text-muted line-through">{formatPrice(product.regularPrice ?? 0)}</span>
              )}
            </p>
          ) : (
            <p className="text-xs font-bold text-brand-red">צרו קשר לפרטי מחיר</p>
          )}
        </div>
        <div className="shrink-0">
          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              model: product.model,
              price: product.price,
              image: product.image,
            }}
            phoneRaw={phoneRaw}
            originId={originId}
          />
        </div>
      </div>
    </div>
  );
}
