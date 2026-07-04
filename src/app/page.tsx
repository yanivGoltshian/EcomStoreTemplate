import Link from "next/link";
import Hero from "@/components/Hero";
import CategoryStrip from "@/components/CategoryStrip";
import CouponBanner from "@/components/CouponBanner";
import DealsCube from "@/components/DealsCube";
import PromoTiles from "@/components/PromoTiles";
import ValueProps from "@/components/ValueProps";
import ProductCarousel from "@/components/ProductCarousel";
import ShareBar from "@/components/ShareBar";
import CustomerVoices from "@/components/CustomerVoices";
import FaqSection from "@/components/FaqSection";
import { LineIcon } from "@/lib/lineIcons";
import { homepage, getProductsByCategory, site } from "@/lib/data";

export default function Home() {
  return (
    <>
      <Hero />

      <CouponBanner />

      <CategoryStrip />
      {homepage.dealsCube?.enabled && (homepage.dealsCube.faces?.length ?? 0) > 0 && (
        <DealsCube
          faces={homepage.dealsCube.faces}
          intervalMs={homepage.dealsCube.intervalMs}
        />
      )}
      <PromoTiles tiles={homepage.promoTiles} />
      <ValueProps />

      <section className="container-x mt-12" data-reveal>
        <Link
          href="/finder/"
          className="finder-teaser group flex flex-col items-center gap-3 rounded-2xl border border-brand-gold/40 bg-white px-6 py-7 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:justify-between sm:text-right"
        >
          <span className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-red/10 text-brand-red">
              <LineIcon name="compass" className="h-8 w-8" />
            </span>
            <span>
              <span className="block text-lg font-extrabold text-heading md:text-xl">
                לא בטוחים מה לבחור?
              </span>
              <span className="mt-1 block text-sm font-light text-muted">
                ענו על כמה שאלות קצרות ונרכיב לכם המלצה אישית תוך שניות
              </span>
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-brand-red px-6 py-2.5 text-sm font-bold text-white transition-colors group-hover:bg-brand-red-dark">
            למצוא מוצר מתאים ←
          </span>
        </Link>
      </section>

      {homepage.sections.map((s) => {
        const products = getProductsByCategory(s.categoryId).slice(0, s.limit);
        if (products.length === 0) return null;
        return (
          <ProductCarousel
            key={s.id}
            title={s.title}
            icon={s.icon}
            link={`/category/${s.categoryId}/`}
            products={products}
          />
        );
      })}

      <section className="container-x mt-14">
        <div className="share-band" data-reveal>
          <h3 className="text-xl font-extrabold text-brand-red md:text-2xl">
            <span className="text-brand-gold">✦</span> אוהבים את {site.name}? ספרו לחברים
          </h3>
          <p className="mt-1.5 mb-5 text-sm font-light text-muted">
            שיתוף קטן מכם — עזרה גדולה לחנות שלנו 🙏
          </p>
          <ShareBar
            center
            shareUrl={`${site.deployUrl}/`}
            message={
              `ממליץ בחום על ${site.name} — ${site.tagline} ` +
              `במחירים משתלמים ושירות אישי 🙂\nשווה ביקור 👇\n${site.deployUrl}/`
            }
            instagramUrl={site.instagram}
            shareTitle={`${site.name} — ${site.tagline}`}
          />
          {site.googleReviewUrl ? (
            <>
              <div className="review-or">או</div>
              <a
                href={site.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="review-cta"
                aria-label={`דרגו את ${site.name} בגוגל`}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                  <path
                    fill="#4285F4"
                    d="M23.5 12.27c0-.82-.07-1.6-.21-2.36H12v4.46h6.45a5.5 5.5 0 0 1-2.39 3.62v3h3.86c2.26-2.08 3.58-5.15 3.58-8.72Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.86-3c-1.07.72-2.45 1.15-4.09 1.15-3.14 0-5.8-2.12-6.75-4.98H1.26v3.09A12 12 0 0 0 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.25 14.26a7.2 7.2 0 0 1 0-4.52V6.65H1.26a12 12 0 0 0 0 10.7l3.99-3.09Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.74c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.65l3.99 3.09C6.2 6.86 8.86 4.74 12 4.74Z"
                  />
                </svg>
                <span>דרגו אותנו ב־Google</span>
                <span className="stars" aria-hidden>
                  ★★★★★
                </span>
              </a>
            </>
          ) : null}
        </div>
      </section>

      <CustomerVoices />
      <FaqSection />

      <section className="mt-14 stars-bg border-y-2 border-brand-gold text-white" data-reveal>
        <div className="container-x flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-5 text-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7 shrink-0 text-brand-gold"
            aria-hidden
          >
            <path d="M12 3 5 5.6v4.9c0 4.1 2.9 7.5 7 8.9 4.1-1.4 7-4.8 7-8.9V5.6L12 3Z" />
            <path d="m9.2 11.6 1.9 1.9 3.6-3.8" />
          </svg>
          <p className="text-base font-extrabold tracking-wide md:text-lg">
            {site.name} – {site.tagline}
          </p>
          <span className="font-semibold text-brand-gold">מגוון · איכות · שירות</span>
        </div>
      </section>
    </>
  );
}
