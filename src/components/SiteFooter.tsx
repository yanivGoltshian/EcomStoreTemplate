import Link from "next/link";
import { nav, site, waLink, telLink, wazeLink } from "@/lib/data";
import NewsletterSignup from "@/components/NewsletterSignup";

const useful = [
  { label: "דף הבית", href: "/" },
  { label: "אודותינו", href: "/about/" },
  { label: "צור קשר", href: "/contact/" },
  { label: "מבצעים", href: "/deals/" },
];

const legal = [
  { label: "הצהרת נגישות", href: "/accessibility/" },
  { label: "תקנון האתר", href: "/terms/" },
  { label: "ביטולים והחזרות", href: "/returns/" },
  { label: "מדיניות פרטיות", href: "/privacy/" },
];

export default function SiteFooter() {
  return (
    <footer className="mt-16 stars-bg text-white">
      <div className="container-x grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
        {/* Brand + contact */}
        <div className="col-span-2 md:col-span-1">
          <p className="text-lg font-black">{site.name}</p>
          <p className="mt-1 text-[0.78rem] text-brand-gold">{site.nameEn}</p>
          <ul className="mt-4 space-y-2 text-[0.82rem] text-white/85">
            <li className="flex items-start gap-2">
              <span aria-hidden>📍</span>
              <span>{site.address.full}</span>
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden>☎️</span>
              <a href={telLink} className="hover:text-brand-gold" dir="ltr">{site.phone}</a>
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden>💬</span>
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="hover:text-brand-gold" dir="ltr">
                WhatsApp {site.whatsappDisplay}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden>🕒</span>
              <span>{site.hours}</span>
            </li>
            {site.vatId ? (
              <li className="flex items-center gap-2">
                <span aria-hidden>🧾</span>
                <span>עוסק מורשה {site.vatId}</span>
              </li>
            ) : null}
          </ul>
          <a
            href={site.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-white/15 px-3 py-1.5 text-[0.78rem] font-semibold hover:bg-white/25"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M13.5 9H15V6.5h-1.8c-1.9 0-2.7 1.2-2.7 2.8V11H9v2.4h1.5V20h2.6v-6.6h1.9l.3-2.4h-2.2V9.6c0-.4.2-.6.8-.6Z" />
            </svg>
            עקבו אחרינו בפייסבוק
          </a>
          <a
            href={wazeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 rounded-md bg-white/15 px-3 py-1.5 text-[0.78rem] font-semibold hover:bg-white/25"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
            </svg>
            ניווט עם Waze · {site.address.full}
          </a>
        </div>

        <div>
          <h4 className="mb-3 border-b border-white/25 pb-2 text-sm font-bold">קטגוריות ראשיות</h4>
          <ul className="space-y-1.5">
            {nav.slice(0, 7).map((c) => (
              <li key={c.id}>
                <Link href={c.href ?? `/category/${c.id}/`} className="text-[0.82rem] text-white/85 hover:text-brand-gold">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 border-b border-white/25 pb-2 text-sm font-bold">שימושי וחשוב</h4>
          <ul className="space-y-1.5">
            {useful.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[0.82rem] text-white/85 hover:text-brand-gold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 border-b border-white/25 pb-2 text-sm font-bold">מידע ותנאי שירות</h4>
          <ul className="space-y-1.5">
            {legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[0.82rem] text-white/85 hover:text-brand-gold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <h4 className="mb-2 mt-5 text-[0.72rem] font-bold text-white/70">הזמנה ותשלום</h4>
          <p className="text-[0.7rem] leading-relaxed text-white/75">
            ההזמנה מתבצעת בוואטסאפ או בטלפון, ותיאום התשלום נעשה מולנו ישירות.
            פרטי אשראי אינם נמסרים באתר.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded border border-white/40 px-2 py-1 text-[0.58rem] font-semibold">🔒 אתר מאובטח SSL</span>
          </div>
        </div>
      </div>

      <NewsletterSignup />

      <div className="border-t border-white/15">
        <div className="container-x py-4 text-center text-[0.72rem] text-white/70">
          כל הזכויות שמורות {new Date().getFullYear()} © {site.name}
        </div>
      </div>
    </footer>
  );
}
