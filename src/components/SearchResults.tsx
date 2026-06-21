"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Product } from "@/lib/types";
import ProductGrid from "./ProductGrid";

type SearchProduct = Pick<
  Product,
  | "id"
  | "name"
  | "model"
  | "price"
  | "regularPrice"
  | "salePrice"
  | "onSale"
  | "image"
  | "inStock"
>;

type SearchCategory = { id: number; name: string; count: number; icon: string; top: string };
type SearchIndex = { products: SearchProduct[]; categories: SearchCategory[] };

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export default function SearchResults() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  const [term, setTerm] = useState(q);
  const [lastQ, setLastQ] = useState(q);
  const [index, setIndex] = useState<SearchIndex | null>(null);

  // Sync the input with the URL query when navigating (no effect needed).
  if (q !== lastQ) {
    setLastQ(q);
    setTerm(q);
  }

  useEffect(() => {
    let active = true;
    fetch("/search-index.json")
      .then((res) => (res.ok ? res.json() : { products: [], categories: [] }))
      .then((data: SearchIndex) => {
        if (active) setIndex(data);
      })
      .catch(() => {
        if (active) setIndex({ products: [], categories: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  const tokens = useMemo(() => normalize(q).split(" ").filter(Boolean), [q]);

  const results = useMemo(() => {
    if (!index) return null;
    if (tokens.length === 0) return [] as SearchProduct[];
    return index.products.filter((p) => {
      const haystack = normalize(`${p.name} ${p.model}`);
      return tokens.every((t) => haystack.includes(t));
    });
  }, [index, tokens]);

  const catMatches = useMemo(() => {
    if (!index || tokens.length === 0) return [] as SearchCategory[];
    return index.categories
      .filter((c) => {
        const hay = normalize(`${c.name} ${c.top}`);
        return tokens.every((t) => hay.includes(t));
      })
      .slice(0, 8);
  }, [index, tokens]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = term.trim();
    router.push(next ? `/search/?q=${encodeURIComponent(next)}` : "/search/");
  }

  return (
    <div className="bg-soft pb-16">
      <div className="stars-bg text-white">
        <div className="container-x py-8">
          <h1 className="text-2xl font-extrabold md:text-3xl">חיפוש מוצרים</h1>
          <form onSubmit={onSubmit} role="search" className="relative mt-4 max-w-2xl">
            <input
              type="search"
              name="q"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="חיפוש מוצר, דגם או קטגוריה..."
              autoFocus
              className="h-12 w-full rounded-md border-0 bg-white pe-14 ps-4 text-sm text-ink outline-none"
            />
            <button
              type="submit"
              aria-label="חיפוש"
              className="absolute end-0 top-0 grid h-12 w-12 place-items-center rounded-e-md bg-brand-red-dark text-white"
            >
              🔍
            </button>
          </form>
        </div>
      </div>

      <div className="container-x pt-8">
        {catMatches.length > 0 && (
          <div className="mb-8">
            <p className="mb-3 text-sm font-bold text-heading">קווי מוצרים תואמים</p>
            <div className="flex flex-wrap gap-2">
              {catMatches.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.id}/`}
                  className="card-hover flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-heading"
                >
                  <span className="text-base">{c.icon}</span>
                  <span>{c.name}</span>
                  <span className="text-xs font-normal text-muted">({c.count})</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {results === null ? (
          <p className="py-20 text-center text-muted">טוען…</p>
        ) : !q.trim() ? (
          <p className="py-20 text-center text-muted">
            הקלידו שם מוצר, דגם או קטגוריה כדי לחפש.
          </p>
        ) : results.length > 0 ? (
          <>
            <p className="mb-6 text-sm text-heading">
              נמצאו <span className="font-bold text-brand-red">{results.length}</span> תוצאות עבור
              {" "}
              <span className="font-bold">״{q}״</span>
            </p>
            <ProductGrid products={results as unknown as Product[]} />
          </>
        ) : catMatches.length > 0 ? (
          <p className="py-10 text-center text-muted">
            לא נמצאו מוצרים בשם ״{q}״, אך תוכלו לעיין בקווי המוצרים התואמים למעלה.
          </p>
        ) : (
          <div className="py-16 text-center">
            <p className="text-lg font-bold text-heading">
              לא נמצאו תוצאות עבור ״{q}״
            </p>
            <p className="mt-2 text-sm text-muted">
              נסו מילת חיפוש אחרת או בדקו את האיות.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
