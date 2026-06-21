import type { Metadata } from "next";
import Link from "next/link";
import { pages, site, telLink, waLink } from "@/lib/data";

export const metadata: Metadata = {
  title: "אודותינו",
  description: `${site.name} — חנות מוצרי חשמל ומכשירי חשמל לבית ולמטבח. מבחר עשיר, מחירים משתלמים, אחריות מלאה ושירות אישי. ${site.address.full}.`,
  alternates: { canonical: "/about/" },
};

export default function AboutPage() {
  const page = pages.about;

  return (
    <div className="bg-soft pb-16">
      <div className="stars-bg text-white">
        <div className="container-x py-12 text-center">
          <h1 className="text-3xl font-extrabold md:text-4xl">{page.title}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-white/85">{site.tagline}</p>
        </div>
      </div>

      <div className="container-x pt-10">
        <div className="mx-auto max-w-3xl rounded-lg border bg-white p-6 text-[0.95rem] leading-8 text-ink">
          <p>
            <strong>{site.name}</strong> {page.intro[0]}
          </p>
          {page.intro.slice(1).map((paragraph, index) => (
            <p key={index} className="mt-4">
              {paragraph}
            </p>
          ))}
          <p className="mt-4">
            {page.visit.addressLead} <strong>{site.address.full}</strong>, {page.visit.phoneLead}{" "}
            <a href={telLink} className="font-semibold text-brand-red" dir="ltr">
              {site.phone}
            </a>
            .
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {page.values.map((v) => (
            <div key={v.title} className="rounded-lg border bg-white p-5 text-center">
              <div className="text-3xl">{v.icon}</div>
              <h3 className="mt-2 font-bold text-heading">{v.title}</h3>
              <p className="mt-1 text-[0.82rem] text-muted">{v.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-md bg-brand-red px-6 py-3 text-sm font-bold text-white hover:bg-brand-red-dark">
            למעבר לחנות
          </Link>
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="rounded-md bg-[#0e7b3a] px-6 py-3 text-sm font-bold text-white hover:opacity-90">
            💬 דברו איתנו בוואטסאפ
          </a>
          <Link href="/contact/" className="rounded-md border-2 border-brand-red px-6 py-3 text-sm font-bold text-brand-red hover:bg-brand-red hover:text-white">
            צור קשר
          </Link>
        </div>
      </div>
    </div>
  );
}
