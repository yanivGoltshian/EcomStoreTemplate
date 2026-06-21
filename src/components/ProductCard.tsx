import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/data";
import FallbackImage from "@/components/FallbackImage";

export default function ProductCard({ product }: { product: Product }) {
  const showSale = product.onSale && product.regularPrice > product.price;
  return (
    <Link
      href={`/product/${product.id}/`}
      className="card-hover group flex h-full flex-col bg-white text-center"
    >
      <div className="relative overflow-hidden bg-white">
        {showSale && (
          <span className="absolute end-2 top-2 z-10 rounded bg-brand-red px-2 py-0.5 text-[0.7rem] font-bold text-white">
            מבצע
          </span>
        )}
        <FallbackImage
          src={product.image || "/images/placeholder.svg"}
          alt={product.name}
          loading="lazy"
          className="mx-auto aspect-square w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-2 pb-4 pt-2">
        <h3 className="clamp-2 min-h-[2.6em] text-[0.82rem] leading-snug text-muted group-hover:text-brand-red">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-center gap-2 pt-1">
          {showSale && (
            <span className="text-sm text-muted line-through">{formatPrice(product.regularPrice)}</span>
          )}
          {product.price > 0 ? (
            <span className="text-lg font-extrabold text-brand-red">{formatPrice(product.price)}</span>
          ) : (
            <span className="text-sm font-bold text-brand-red">לפרטים נוספים</span>
          )}
        </div>
      </div>
    </Link>
  );
}
