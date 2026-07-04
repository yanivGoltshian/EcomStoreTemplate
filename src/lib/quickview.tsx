"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Product } from "@/lib/types";

type QuickViewContextValue = {
  current: Product | null;
  openQuickView: (product: Product) => void;
  close: () => void;
};

const QuickViewContext = createContext<QuickViewContextValue | null>(null);

export function QuickViewProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<Product | null>(null);

  const openQuickView = useCallback((product: Product) => setCurrent(product), []);
  const close = useCallback(() => setCurrent(null), []);

  const value = useMemo(() => ({ current, openQuickView, close }), [current, openQuickView, close]);

  return <QuickViewContext.Provider value={value}>{children}</QuickViewContext.Provider>;
}

export function useQuickView(): QuickViewContextValue {
  const ctx = useContext(QuickViewContext);
  if (!ctx) throw new Error("useQuickView must be used within a QuickViewProvider");
  return ctx;
}
