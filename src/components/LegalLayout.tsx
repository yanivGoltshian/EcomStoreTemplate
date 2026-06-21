import Link from "next/link";
import { site } from "@/lib/data";
import type { LegalSection as ContentLegalSection } from "@/lib/types";

export type LegalSection = ContentLegalSection;

export default function LegalLayout({
  title,
  intro,
  updated,
  sections,
}: {
  title: string;
  intro?: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <div className="bg-soft pb-16">
      <div className="stars-bg text-white">
        <div className="container-x py-12 text-center">
          <h1 className="text-3xl font-extrabold md:text-4xl">{title}</h1>
          {intro ? <p className="mx-auto mt-3 max-w-2xl text-white/85">{intro}</p> : null}
        </div>
      </div>

      <div className="container-x pt-10">
        <article className="mx-auto max-w-3xl rounded-lg border bg-white p-6 text-[0.95rem] leading-8 text-ink md:p-8">
          <p className="text-[0.8rem] text-muted">עודכן לאחרונה: {updated}</p>

          {sections.map((s, i) => (
            <section key={i} className="mt-6 first:mt-4">
              <h2 className="text-lg font-bold text-heading">{s.heading}</h2>
              {s.paragraphs?.map((p, j) => (
                <p key={j} className="mt-2">
                  {p}
                </p>
              ))}
              {s.bullets ? (
                <ul className="mt-2 list-disc space-y-1 pr-5">
                  {s.bullets.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              ) : null}
              {s.links?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {s.links.map((l, j) => (
                    <Link
                      key={j}
                      href={l.href}
                      className="inline-flex items-center gap-1 rounded-md border-2 border-brand-red px-4 py-2 text-sm font-bold text-brand-red hover:bg-brand-red hover:text-white"
                    >
                      {l.label}
                      <span aria-hidden>←</span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </section>
          ))}

          <div className="mt-8 border-t pt-4 text-[0.85rem] text-muted">
            <p>
              לשאלות בנושא זה ניתן ליצור קשר עם <strong>{site.name}</strong> בטלפון{" "}
              <a href={`tel:${site.phoneRaw}`} className="font-semibold text-brand-red" dir="ltr">
                {site.phone}
              </a>{" "}
              או בכתובת {site.address.full}.
            </p>
          </div>
        </article>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-md bg-brand-red px-6 py-3 text-sm font-bold text-white hover:bg-brand-red-dark">
            חזרה לחנות
          </Link>
          <Link href="/contact/" className="rounded-md border-2 border-brand-red px-6 py-3 text-sm font-bold text-brand-red hover:bg-brand-red hover:text-white">
            צור קשר
          </Link>
        </div>
      </div>
    </div>
  );
}
