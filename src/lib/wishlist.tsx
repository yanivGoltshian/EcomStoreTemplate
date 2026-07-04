"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type WishlistItem = {
  id: number;
  name: string;
  model: string;
  price: number;
  image: string;
};

type WishlistContextValue = {
  items: WishlistItem[];
  count: number;
  has: (id: number) => boolean;
  toggle: (item: WishlistItem) => boolean; // returns true if now saved
  add: (item: WishlistItem) => void;
  remove: (id: number) => void;
  clear: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "store-wishlist-v1";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota errors */
    }
  }, [items, loaded]);

  // Keep the heart in sync across tabs / other components.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;
      try {
        const parsed = e.newValue ? JSON.parse(e.newValue) : [];
        if (Array.isArray(parsed)) setItems(parsed);
      } catch {
        /* ignore */
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const ids = useMemo(() => new Set(items.map((p) => p.id)), [items]);

  const has = useCallback((id: number) => ids.has(id), [ids]);

  const add = useCallback((item: WishlistItem) => {
    setItems((prev) => (prev.some((p) => p.id === item.id) ? prev : [item, ...prev]));
  }, []);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const toggle = useCallback((item: WishlistItem) => {
    let nowSaved = false;
    setItems((prev) => {
      if (prev.some((p) => p.id === item.id)) {
        nowSaved = false;
        return prev.filter((p) => p.id !== item.id);
      }
      nowSaved = true;
      return [item, ...prev];
    });
    return !ids.has(item.id);
  }, [ids]);

  const clear = useCallback(() => setItems([]), []);

  const count = items.length;

  const value = useMemo(
    () => ({ items, count, has, toggle, add, remove, clear }),
    [items, count, has, toggle, add, remove, clear],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
