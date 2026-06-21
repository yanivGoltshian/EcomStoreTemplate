"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";

type Props = {
  product: { id: number; name: string; model: string; price: number; image: string };
  phoneRaw: string;
};

export default function AddToCartButton({ product, phoneRaw }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  if (product.price <= 0) {
    return (
      <a
        href={`tel:${phoneRaw}`}
        className="flex-1 rounded-md bg-brand-red px-6 py-3 text-center text-base font-bold text-white transition-colors hover:bg-brand-red-dark"
      >
        ☎ צרו קשר לרכישה
      </a>
    );
  }

  function handleAdd() {
    addItem({
      id: product.id,
      name: product.name,
      model: product.model,
      price: product.price,
      image: product.image,
    });
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      aria-live="polite"
      className={`flex-1 rounded-md px-6 py-3 text-base font-bold text-white transition-colors ${
        added ? "bg-green-600 hover:bg-green-600" : "bg-brand-red hover:bg-brand-red-dark"
      }`}
    >
      {added ? "✓ נוסף לסל" : "🛒 הוספה לסל"}
    </button>
  );
}
