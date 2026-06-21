import type { ReactNode } from "react";

const items: { title: string; sub: string; icon: ReactNode }[] = [
  {
    title: "שירות אישי",
    sub: "צוות מקצועי זמין לכל שאלה",
    icon: (
      <>
        <path d="M5 12.5v-.7a7 7 0 0 1 14 0v.7" />
        <path d="M4.2 12.5h1.6a1 1 0 0 1 1 1v3.2a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2v-1.4a1.8 1.8 0 0 1 1.2-1.6Z" />
        <path d="M19.8 12.5h-1.6a1 1 0 0 0-1 1v3.2a1 1 0 0 0 1 1h.4l.1.5a3 3 0 0 1-2.9 2.3h-2.4" />
      </>
    ),
  },
  {
    title: "מוצרים מקוריים",
    sub: "100% מהמותגים המובילים",
    icon: (
      <>
        <circle cx="12" cy="9.2" r="5.2" />
        <path d="m9.2 13.3-1.7 7.2 4.5-2.5 4.5 2.5-1.7-7.2" />
        <path d="m12 6.5.85 1.72 1.9.28-1.37 1.34.32 1.9L12 11l-1.7.9.32-1.9L9.25 8.5l1.9-.28z" />
      </>
    ),
  },
  {
    title: "אחריות מלאה",
    sub: "אחריות יבואן רשמי על המוצרים",
    icon: (
      <>
        <path d="M12 3 5 5.6v4.9c0 4.1 2.9 7.5 7 8.9 4.1-1.4 7-4.8 7-8.9V5.6L12 3Z" />
        <path d="m9.2 11.6 1.9 1.9 3.6-3.8" />
      </>
    ),
  },
];

export default function ValueProps() {
  return (
    <section className="container-x pt-10">
      <div className="grid grid-cols-1 divide-y rounded-xl border bg-white shadow-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map((it) => (
          <div key={it.title} className="flex items-center justify-center gap-3 px-5 py-4">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 shrink-0 text-brand-gold"
              aria-hidden
            >
              {it.icon}
            </svg>
            <div className="text-right">
              <p className="text-[0.92rem] font-bold text-heading">{it.title}</p>
              <p className="text-[0.74rem] text-muted">{it.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
