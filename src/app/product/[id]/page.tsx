import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCarousel from "@/components/ProductCarousel";
import AddToCartButton from "@/components/AddToCartButton";
import ShareBar from "@/components/ShareBar";
import { products, site, getProduct, getCategory, getProductsByCategory, formatPrice } from "@/lib/data";

export function generateStaticParams() {
  return products.map((p) => ({ id: String(p.id) }));
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const id = Number((await params).id);
  const product = getProduct(id);
  if (!product) return { title: "מוצר לא נמצא" };
  const desc =
    stripHtml(product.description).slice(0, 160) ||
    `${product.name}${product.model ? ` · דגם ${product.model}` : ""} — לרכישה ב${site.name}.`;
  return {
    title: product.name,
    description: desc,
    alternates: { canonical: `/product/${id}/` },
    openGraph: {
      title: `${product.name} | ${site.name}`,
      description: desc,
      type: "website",
      url: `${site.url}/product/${id}/`,
      images: [{ url: product.image, alt: product.name }],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  const product = getProduct(id);
  if (!product) notFound();

  const primaryCat = product.categoryIds.map(getCategory).find(Boolean);
  const related = primaryCat
    ? getProductsByCategory(primaryCat.id).filter((p) => p.id !== product.id).slice(0, 12)
    : [];
  const showSale = product.onSale && product.regularPrice > product.price;

  const shareUrl = `${site.deployUrl}/product/${product.id}/`;
  const shareMessage =
    `😍 מצאתי משהו מושלם ב${site.name}!\n` +
    `${product.name}${product.model ? ` (דגם ${product.model})` : ""}` +
    `${product.price > 0 ? ` — ${formatPrice(product.price)}` : ""}\n` +
    `שווה הצצה 👈\n${shareUrl}`;

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: [`${site.url}${product.image}`],
    description: stripHtml(product.description).slice(0, 300) || product.name,
    sku: String(product.id),
    ...(product.model ? { mpn: product.model } : {}),
    ...(product.price > 0
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "ILS",
            price: product.price,
            availability: product.inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            url: `${site.url}/product/${product.id}/`,
            seller: { "@type": "Organization", name: site.name },
          },
        }
      : {}),
  };

  return (
    <div className="pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <div className="bg-soft">
        <div className="container-x py-3 text-[0.72rem] text-muted">
          <Link href="/" className="hover:text-brand-red">דף הבית</Link>
          {primaryCat && (
            <>
              <span className="px-1.5">/</span>
              <Link href={`/category/${primaryCat.id}/`} className="hover:text-brand-red">
                {primaryCat.name}
              </Link>
            </>
          )}
          <span className="px-1.5">/</span>
          <span className="text-heading">{product.name}</span>
        </div>
      </div>

      <div className="container-x grid gap-8 pt-8 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image || "/images/placeholder.svg"}
            alt={product.name}
            className="mx-auto aspect-square w-full max-w-md object-contain"
          />
        </div>

        <div className="flex flex-col">
          <h1 className="text-2xl font-extrabold text-heading md:text-3xl">{product.name}</h1>
          {product.model && (
            <p className="mt-1 text-sm text-muted">דגם: {product.model}</p>
          )}

          <div className="mt-4 flex items-end gap-3">
            {product.price > 0 ? (
              <>
                <span className="text-3xl font-extrabold text-brand-red">{formatPrice(product.price)}</span>
                {showSale && (
                  <span className="pb-1 text-lg text-muted line-through">{formatPrice(product.regularPrice)}</span>
                )}
              </>
            ) : (
              <span className="text-xl font-bold text-brand-red">צרו קשר לפרטי מחיר</span>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                model: product.model,
                price: product.price,
                image: product.image,
              }}
              phoneRaw={site.phoneRaw}
            />
            <a
              href={`tel:${site.phoneRaw}`}
              className="grid place-items-center rounded-md border-2 border-brand-red px-5 text-sm font-bold text-brand-red hover:bg-brand-red hover:text-white"
            >
              ☎ ייעוץ
            </a>
            <a
              href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(
                `שלום, אשמח לייעוץ לגבי המוצר: ${product.name}${product.model ? ` (דגם ${product.model})` : ""}\n${site.deployUrl}/product/${product.id}/`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="ייעוץ בוואטסאפ"
              className="grid place-items-center gap-1.5 rounded-md border-2 border-brand-red px-4 text-sm font-bold text-brand-red hover:bg-brand-red hover:text-white [grid-auto-flow:column]"
            >
              <svg viewBox="0 0 32 32" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d="M16.001 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.59 4.46 1.71 6.4L3.2 28.8l6.56-1.72a12.74 12.74 0 0 0 6.24 1.62h.01c7.06 0 12.8-5.74 12.8-12.8s-5.75-12.8-12.81-12.8zm0 23.04h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-3.89 1.02 1.04-3.79-.25-.39a10.62 10.62 0 0 1-1.63-5.66c0-5.87 4.78-10.65 10.65-10.65 2.85 0 5.52 1.11 7.53 3.12a10.58 10.58 0 0 1 3.12 7.53c0 5.87-4.78 10.65-10.64 10.65zm5.84-7.98c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.71.16-.21.32-.82 1.04-1 1.25-.18.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.54-.71-.55-.18-.01-.4-.01-.61-.01-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.64s1.14 3.06 1.3 3.27c.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.89-.77 2.16-1.52.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37z" />
              </svg>
              ייעוץ
            </a>
          </div>

          <div className="mt-5 border-t pt-5">
            <ShareBar
              shareUrl={shareUrl}
              message={shareMessage}
              instagramUrl={site.instagram}
              shareTitle={`${product.name} | ${site.name}`}
              label="שתפו את המוצר"
            />
          </div>

          <ul className="mt-6 space-y-2 border-t pt-5 text-[0.82rem] text-muted">
            <li>🛡️ אחריות יבואן רשמי</li>
          </ul>
        </div>
      </div>

      {product.description && (
        <div className="container-x pt-12">
          <div className="section-title mb-5">
            <h2 className="text-xl font-extrabold text-brand-red">תיאור המוצר</h2>
          </div>
          <div
            className="prose-rtl max-w-none text-[0.9rem] leading-relaxed text-ink"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}

      {related.length > 0 && (
        <ProductCarousel
          title="מוצרים נוספים"
          icon="🛍️"
          link={primaryCat ? `/category/${primaryCat.id}/` : "/"}
          products={related}
        />
      )}
    </div>
  );
}
