import Link from "next/link";
import type { ReactNode } from "react";
import { nav, getProductsByCategory } from "@/lib/data";

// Uniform mono-line icons per category (classic, consistent look — no emoji)
const ICONS: Record<string, ReactNode> = {
  // מוצרים למטבח — chef hat
  "120": (
    <>
      <path d="M7 14.5h10V19a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-4.5Z" />
      <path d="M7 14.5a3.8 3.8 0 0 1-.7-7.5 3.5 3.5 0 0 1 6.7-1.2 3.5 3.5 0 0 1 4 4.2A3.8 3.8 0 0 1 17 14.5" />
      <path d="M9.5 16.8v1.6M12 16.8v1.6M14.5 16.8v1.6" />
    </>
  ),
  // מוצרי קיץ — sun
  "112": (
    <>
      <circle cx="12" cy="12" r="4.3" />
      <path d="M12 1.8v2.6M12 19.6v2.6M1.8 12h2.6M19.6 12h2.6M4.6 4.6 6.4 6.4M17.6 17.6l1.8 1.8M19.4 4.6 17.6 6.4M6.4 17.6 4.6 19.4" />
    </>
  ),
  // מוצרי חורף — snowflake
  "15": (
    <>
      <path d="M12 2v20M3.34 7l17.32 10M20.66 7 3.34 17" />
      <path d="M12 5.6 9.9 4M12 5.6 14.1 4M12 18.4 9.9 20M12 18.4 14.1 20" />
      <path d="M5.1 8.6 3 9M19 15l-2.1.4M19 9l-2.1-.4M5.1 15.4 3 15" />
    </>
  ),
  // מוצרי טיפוח — scissors
  "140": (
    <>
      <circle cx="6" cy="7" r="2.4" />
      <circle cx="6" cy="17" r="2.4" />
      <path d="M8 8.6 20 16M8 15.4 20 8" />
    </>
  ),
  // נקיון הבית — spray bottle
  "136": (
    <>
      <path d="M9 8.5h5a2 2 0 0 1 2 2V19a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-8.5a2 2 0 0 1 2-2Z" />
      <path d="M9 8.5V5.5h3v3" />
      <path d="M12 5.5V4.5h2.4" />
      <path d="M15.8 4.6h2.4M15.8 6.4h2.4M16.4 8.2h1.8" />
    </>
  ),
  // אביזרי חשמל — plug
  "746": (
    <>
      <path d="M9 3v5M15 3v5" />
      <path d="M7 8h10v2a5 5 0 0 1-10 0V8Z" />
      <path d="M12 15v6" />
    </>
  ),
  // פינוקים ומתוקים — gift
  "754": (
    <>
      <rect x="4.5" y="10" width="15" height="9.5" rx="1" />
      <path d="M4.5 13.4h15M12 10v9.5" />
      <path d="M12 10c-1.4 0-3.6.2-3.6-1.9 0-1.3 1.5-1.8 2.4-1.1C11.7 7.7 12 10 12 10ZM12 10c1.4 0 3.6.2 3.6-1.9 0-1.3-1.5-1.8-2.4-1.1C12.3 7.7 12 10 12 10Z" />
    </>
  ),
  // מוצרים לבנים — washing machine
  "779": (
    <>
      <rect x="5.5" y="3" width="13" height="18" rx="2" />
      <circle cx="12" cy="13" r="4.3" />
      <circle cx="12" cy="13" r="1.6" />
      <path d="M8.5 6.4h.01M11 6.4h.01" />
    </>
  ),
  // גרילים — grill
  "695": (
    <>
      <path d="M4 7.5h16a8 8 0 0 1-16 0Z" />
      <path d="M8 13.5l-2 6.5M16 13.5l2 6.5M12 14v6" />
      <path d="M9 3c.6 1 .6 1.7 0 2.7M13 3c.6 1 .6 1.7 0 2.7" />
    </>
  ),
  // ELECTRIC PLATINUM — crown
  "377": (
    <>
      <path d="M4 18h16M4 18 2.6 8.8 8 13l4-7 4 7 5.4-4.2L20 18" />
    </>
  ),
  default: (
    <>
      <path d="M3 12 12 3l9 9-9 9-9-9Z" />
      <circle cx="9" cy="9" r="1.1" />
    </>
  ),
};

function CategoryIcon({ id }: { id: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-9 w-9"
      aria-hidden
    >
      {ICONS[String(id)] ?? ICONS.default}
    </svg>
  );
}

export default function CategoryStrip() {
  return (
    <section className="container-x pt-12">
      <div className="section-title mb-6">
        <h2 className="whitespace-nowrap text-lg font-bold text-heading">הקטגוריות שלנו</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {nav.map((c) => {
          const thumb = c.thumb ?? getProductsByCategory(c.id).find((p) => p.image)?.image;
          return (
            <Link
              key={c.id}
              href={c.href ?? `/category/${c.id}/`}
              className="card-hover group flex flex-col items-center rounded-xl border bg-white p-4 text-center shadow-card"
            >
              <span className="grid h-11 w-11 place-items-center text-brand-red">
                <CategoryIcon id={c.id} />
              </span>
              <span className="mt-2 flex min-h-[2.6em] items-center justify-center text-[0.92rem] font-bold leading-tight text-heading">
                {c.name}
              </span>
              <span className="mt-1 grid h-24 w-full place-items-center">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt={c.name}
                    loading="lazy"
                    className="max-h-24 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                  />
                ) : null}
              </span>
              <span className="mt-3 inline-flex items-center gap-1 text-[0.8rem] font-semibold text-brand-red">
                לצפייה במוצרים
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                  aria-hidden
                >
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
