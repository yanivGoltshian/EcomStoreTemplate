"use client";

import { useRef } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

export default function ProductCarousel({
  title,
  icon,
  link,
  products,
}: {
  title: string;
  icon?: string;
  link: string;
  products: Product[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 480, behavior: "smooth" });

  return (
    <section className="container-x pt-12">
      <div className="section-title mb-6">
        <Link href={link} className="flex items-center gap-2 text-xl font-extrabold text-brand-red md:text-2xl">
          {icon && <span>{icon}</span>}
          {title}
        </Link>
      </div>

      <div className="relative">
        <div ref={ref} className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-2">
          {products.map((p) => (
            <div key={p.id} className="w-[46%] shrink-0 snap-start border bg-white sm:w-[30%] md:w-[218px]">
              <ProductCard product={p} />
            </div>
          ))}
        </div>

        <button
          onClick={() => scroll(1)}
          aria-label="הקודם"
          className="absolute -end-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border bg-white text-xl text-brand-red shadow md:grid"
        >
          ›
        </button>
        <button
          onClick={() => scroll(-1)}
          aria-label="הבא"
          className="absolute -start-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border bg-white text-xl text-brand-red shadow md:grid"
        >
          ‹
        </button>
      </div>
    </section>
  );
}
