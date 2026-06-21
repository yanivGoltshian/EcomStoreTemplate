import ProductGrid from "@/components/ProductGrid";
import { getDeals, site } from "@/lib/data";

export const metadata = {
  title: "מוצרים עד 149 ₪",
  description: `כל המבצעים וההצעות המשתלמות ב${site.name}.`,
  alternates: { canonical: "/deals/" },
};

export default function DealsPage() {
  const products = getDeals(149);
  return (
    <div className="bg-soft pb-16">
      <div className="stars-bg text-white">
        <div className="container-x py-10 text-center">
          <h1 className="text-3xl font-extrabold md:text-4xl">💰 מוצרים עד 149 ₪</h1>
          <p className="mt-2 text-white/80">{products.length} מוצרים במחירים שלא תמצאו במקום אחר</p>
        </div>
      </div>
      <div className="container-x pt-10">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
