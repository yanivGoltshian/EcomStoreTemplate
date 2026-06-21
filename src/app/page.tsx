import Hero from "@/components/Hero";
import CategoryStrip from "@/components/CategoryStrip";
import DealsCube from "@/components/DealsCube";
import PromoTiles from "@/components/PromoTiles";
import ValueProps from "@/components/ValueProps";
import ProductCarousel from "@/components/ProductCarousel";
import ShareBar from "@/components/ShareBar";
import { homepage, getProductsByCategory, site } from "@/lib/data";

export default function Home() {
  return (
    <>
      <Hero />

      <CategoryStrip />
      {homepage.dealsCube?.enabled && (homepage.dealsCube.faces?.length ?? 0) > 0 && (
        <DealsCube
          faces={homepage.dealsCube.faces}
          intervalMs={homepage.dealsCube.intervalMs}
        />
      )}
      <PromoTiles tiles={homepage.promoTiles} />
      <ValueProps />

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
        <div className="share-band">
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
        </div>
      </section>

      <section className="mt-14 stars-bg border-y-2 border-brand-gold text-white">
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
