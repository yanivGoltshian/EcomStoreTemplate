import type { Metadata } from "next";
import { Suspense } from "react";
import SearchResults from "@/components/SearchResults";
import { site } from "@/lib/data";

export const metadata: Metadata = {
  title: "חיפוש מוצרים",
  description: `חיפוש מוצרי חשמל ומכשירים ב${site.name} — מצאו את המוצר או הדגם שאתם מחפשים.`,
  alternates: { canonical: "/search/" },
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-soft pb-16">
          <div className="stars-bg text-white">
            <div className="container-x py-8">
              <h1 className="text-2xl font-extrabold md:text-3xl">חיפוש מוצרים</h1>
            </div>
          </div>
          <p className="container-x py-20 text-center text-muted">טוען…</p>
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
