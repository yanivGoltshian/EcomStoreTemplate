"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Resets scroll to the top on every route change. Uses "instant" so it
// overrides the global `scroll-behavior: smooth`, which otherwise leaves
// product/category pages scrolled where the previous page was.
export default function ScrollToTop() {
  const pathname = usePathname();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}
