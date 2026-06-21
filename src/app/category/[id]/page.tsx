import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGrid from "@/components/ProductGrid";
import { categories, site, getCategory, getProductsByCategory } from "@/lib/data";

export function generateStaticParams() {
  return categories.map((c) => ({ id: String(c.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const id = Number((await params).id);
  const category = getCategory(id);
  if (!category) return { title: "קטגוריה לא נמצאה" };
  const count = getProductsByCategory(id).length;
  const description = `${category.name} ב${site.name} — מבחר של ${count} מוצרים במחירים משתלמים, אחריות מלאה ושירות אישי. משלוח לכל הארץ.`;
  return {
    title: category.name,
    description,
    alternates: { canonical: `/category/${id}/` },
    openGraph: {
      title: `${category.name} | ${site.name}`,
      description,
      type: "website",
      url: `${site.url}/category/${id}/`,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  const category = getCategory(id);
  if (!category) notFound();

  const products = getProductsByCategory(id);
  const subs = categories.filter((c) => c.parent === id);

  return (
    <div className="bg-soft pb-16">
      <div className="stars-bg text-white">
        <div className="container-x py-8">
          <nav className="mb-2 text-[0.72rem] text-white/70">
            <Link href="/" className="hover:text-white">דף הבית</Link>
            <span className="px-1.5">/</span>
            <span className="text-white">{category.name}</span>
          </nav>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold md:text-3xl">
            <span>{category.icon}</span>
            {category.name}
          </h1>
          <p className="mt-1 text-[0.8rem] text-white/75">{products.length} מוצרים</p>
        </div>
      </div>

      <div className="container-x">
        {subs.length > 0 && (
          <div className="no-scrollbar -mt-5 mb-6 flex gap-2 overflow-x-auto">
            {subs.map((s) => (
              <Link
                key={s.id}
                href={`/category/${s.id}/`}
                className="shrink-0 rounded-full border bg-white px-4 py-1.5 text-[0.8rem] font-medium text-heading shadow-sm hover:border-brand-red hover:text-brand-red"
              >
                {s.name}
              </Link>
            ))}
          </div>
        )}

        <div className={subs.length > 0 ? "" : "pt-8"}>
          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <p className="py-20 text-center text-muted">לא נמצאו מוצרים בקטגוריה זו.</p>
          )}
        </div>
      </div>
    </div>
  );
}
