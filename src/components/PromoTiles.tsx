import Link from "next/link";
import type { PromoTile } from "@/lib/types";

export default function PromoTiles({ tiles }: { tiles: PromoTile[] }) {
  return (
    <section className="container-x pt-8">
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {tiles.map((t) => (
          <Link key={t.id} href={`/category/${t.categoryId}/`} className="card-hover group block">
            <div className="overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={t.image}
                alt={t.title}
                loading="lazy"
                className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <p className="mt-2 text-center text-[0.8rem] font-semibold text-heading group-hover:text-brand-red">
              {t.title}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
