import type { Metadata } from "next";
import { pages, site, waLink, telLink } from "@/lib/data";

export const metadata: Metadata = {
  title: "צור קשר",
  description: `צרו קשר עם ${site.name} — טלפון ${site.phone}, וואטסאפ, פייסבוק. כתובת החנות: ${site.address.full}. ${site.hours}.`,
  alternates: { canonical: "/contact/" },
};

const mapQuery = encodeURIComponent(
  `${site.address.streetEn}, ${site.address.cityEn}, Israel`
);

export default function ContactPage() {
  const page = pages.contact;
  const cards = [
    { icon: "☎️", title: "טלפון ושירות לקוחות", value: site.phone, href: telLink, dir: "ltr" as const },
    { icon: "💬", title: "וואטסאפ", value: site.whatsappDisplay, href: waLink, dir: "ltr" as const },
    { icon: "📘", title: "פייסבוק", value: "@mystore", href: site.facebook, dir: "ltr" as const },
  ];

  return (
    <div className="bg-soft pb-16">
      <div className="stars-bg text-white">
        <div className="container-x py-10 text-center">
          <h1 className="text-3xl font-extrabold md:text-4xl">{page.title}</h1>
          <p className="mt-2 text-white/80">{page.lead} — {site.name}</p>
        </div>
      </div>

      <div className="container-x grid gap-8 pt-10 md:grid-cols-2">
        <div>
          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
            {cards.map((c) => (
              <a
                key={c.title}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="card-hover flex items-center gap-3 rounded-lg border bg-white px-4 py-4"
              >
                <span className="text-2xl">{c.icon}</span>
                <span>
                  <span className="block text-[0.72rem] text-muted">{c.title}</span>
                  <span className="block font-bold text-heading" dir={c.dir}>{c.value}</span>
                </span>
              </a>
            ))}
          </div>

          <div className="mt-6 rounded-lg border bg-white p-5">
            <h2 className="text-lg font-bold text-heading">פרטי החנות</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink">
              <li className="flex items-start gap-2">
                <span aria-hidden>📍</span>
                <span>{site.address.full}</span>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden>🕒</span>
                <span>{site.hours}</span>
              </li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={telLink} className="rounded-md bg-brand-red px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-red-dark">
                ☎ התקשרו עכשיו
              </a>
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="rounded-md bg-[#0e7b3a] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
                💬 שלחו וואטסאפ
              </a>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border bg-white">
          <iframe
            title={`מפה — ${site.address.full}`}
            src={`https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`}
            className="h-full min-h-[360px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
