"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type IdxProduct = {
  id: number;
  name: string;
  model: string;
  price: number;
  regularPrice: number;
  salePrice: number;
  onSale: boolean;
  image: string;
  inStock: boolean;
  groupId: number;
  groupName: string;
  groupIcon: string;
};

type IdxCategory = {
  id: number;
  name: string;
  count: number;
  icon: string;
  top: string;
};

type SearchIndex = { products: IdxProduct[]; categories: IdxCategory[] };

type FlatItem = { key: string; href: string };
type RowCategory = IdxCategory & { idx: number };
type RowProduct = IdxProduct & { idx: number };
type RowGroup = { id: number; name: string; icon: string; headerIdx: number; items: RowProduct[] };

const MAX_CATEGORIES = 5;
const MAX_GROUPS = 5;
const PER_GROUP = 4;
const MAX_PRODUCTS = 14;

const ils = (n: number) => "₪" + n.toLocaleString("he-IL");
const normalize = (v: string) => v.toLowerCase().replace(/\s+/g, " ").trim();

// Fetch the index once and share it across every instance (desktop + mobile).
let cache: SearchIndex | null = null;
let inflight: Promise<SearchIndex> | null = null;
function loadIndex(): Promise<SearchIndex> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch("/search-index.json")
      .then((r) => (r.ok ? r.json() : { products: [], categories: [] }))
      .then((d: SearchIndex) => {
        cache = d;
        return d;
      })
      .catch(() => ({ products: [], categories: [] }));
  }
  return inflight;
}

function score(haystack: string, query: string, firstToken: string): number {
  if (haystack.startsWith(query)) return 3000;
  const i = haystack.indexOf(query);
  if (i >= 0) return 2000 - i;
  const j = haystack.indexOf(firstToken);
  return j >= 0 ? 1000 - j : 0;
}

export default function SearchAutocomplete({
  variant = "desktop",
  onNavigate,
}: {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const listId = useId();
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActive(-1);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function ensureIndex() {
    if (!index) loadIndex().then(setIndex);
  }

  const hasQuery = query.trim().length > 0;
  const allResultsHref = `/search/?q=${encodeURIComponent(query.trim())}`;

  const view = useMemo(() => {
    const empty = { cats: [] as RowCategory[], groups: [] as RowGroup[], flat: [] as FlatItem[], allIdx: -1, total: 0 };
    const tokens = normalize(query).split(" ").filter(Boolean);
    if (!index || tokens.length === 0) return empty;

    const q = normalize(query);
    const first = tokens[0];

    const catMatches = index.categories
      .filter((c) => {
        const hay = normalize(`${c.name} ${c.top}`);
        return tokens.every((t) => hay.includes(t));
      })
      .map((c) => ({ c, s: score(normalize(c.name), q, first) }))
      .sort((a, b) => b.s - a.s || b.c.count - a.c.count)
      .slice(0, MAX_CATEGORIES)
      .map((x) => x.c);

    const matched = index.products
      .filter((p) => {
        const hay = normalize(`${p.name} ${p.model}`);
        return tokens.every((t) => hay.includes(t));
      })
      .map((p) => ({
        p,
        s: Math.max(score(normalize(p.name), q, first), score(normalize(p.model), q, first) + 200),
      }))
      .sort((a, b) => b.s - a.s);

    const total = matched.length;

    const groupMap = new Map<number, { id: number; name: string; icon: string; items: IdxProduct[] }>();
    let used = 0;
    for (const { p } of matched) {
      if (used >= MAX_PRODUCTS) break;
      let g = groupMap.get(p.groupId);
      if (!g) {
        if (groupMap.size >= MAX_GROUPS) continue;
        g = { id: p.groupId, name: p.groupName, icon: p.groupIcon, items: [] };
        groupMap.set(p.groupId, g);
      }
      if (g.items.length < PER_GROUP) {
        g.items.push(p);
        used += 1;
      }
    }

    // Assign stable keyboard indices in render order.
    const flat: FlatItem[] = [];
    let n = 0;
    const cats: RowCategory[] = catMatches.map((c) => {
      const idx = n++;
      flat.push({ key: `c${c.id}`, href: `/category/${c.id}/` });
      return { ...c, idx };
    });
    const groups: RowGroup[] = [...groupMap.values()].map((g) => {
      const headerIdx = n++;
      flat.push({ key: `g${g.id}`, href: `/category/${g.id}/` });
      const items: RowProduct[] = g.items.map((p) => {
        const idx = n++;
        flat.push({ key: `p${p.id}`, href: `/product/${p.id}/` });
        return { ...p, idx };
      });
      return { id: g.id, name: g.name, icon: g.icon, headerIdx, items };
    });
    const allIdx = n++;
    flat.push({ key: "all", href: allResultsHref });

    return { cats, groups, flat, allIdx, total };
  }, [index, query, allResultsHref]);

  // Keep the active option in view.
  useEffect(() => {
    if (active < 0 || !panelRef.current) return;
    const el = panelRef.current.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function close() {
    setOpen(false);
    setActive(-1);
  }

  function go(href: string) {
    close();
    onNavigate?.();
    router.push(href);
  }

  function pick() {
    close();
    onNavigate?.();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      ensureIndex();
      setOpen(true);
      setActive((a) => Math.min(a + 1, view.flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && active >= 0 && view.flat[active]) go(view.flat[active].href);
      else if (hasQuery) go(allResultsHref);
    } else if (e.key === "Escape") {
      close();
    }
  }

  const noMatches = hasQuery && index !== null && view.cats.length === 0 && view.groups.length === 0;
  const showPanel = open && hasQuery;

  const inputClass =
    variant === "desktop"
      ? "h-11 w-full rounded-full border bg-soft pe-12 ps-5 text-sm text-ink outline-none transition-colors focus:border-brand-red focus:bg-white"
      : "h-10 w-full rounded-md border bg-soft pe-11 ps-4 text-sm text-ink outline-none focus:border-brand-red focus:bg-white";

  return (
    <div ref={wrapRef} className="relative w-full" role="search">
      <div className="relative">
        <input
          type="search"
          name="q"
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
            setOpen(true);
            ensureIndex();
          }}
          onFocus={() => {
            ensureIndex();
            if (hasQuery) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder="חיפוש מוצר, דגם או קטגוריה..."
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          className={inputClass}
        />
        <button
          type="button"
          aria-label="חיפוש"
          onClick={() => hasQuery && go(allResultsHref)}
          className={
            variant === "desktop"
              ? "absolute end-1 top-1 grid h-9 w-9 place-items-center rounded-full bg-brand-red text-white transition-colors hover:bg-brand-red-dark"
              : "absolute end-1 top-1 grid h-8 w-8 place-items-center rounded-md bg-brand-red text-white"
          }
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" />
          </svg>
        </button>
      </div>

      {showPanel && (
        <div
          ref={panelRef}
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-line bg-white py-2 text-ink shadow-xl"
        >
          {index === null ? (
            <p className="px-4 py-6 text-center text-sm text-muted">טוען…</p>
          ) : noMatches ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              לא נמצאו תוצאות עבור ״{query.trim()}״
            </p>
          ) : (
            <>
              {view.cats.length > 0 && (
                <div className="pb-1">
                  <p className="px-4 pb-1 pt-1 text-[0.7rem] font-bold uppercase tracking-wide text-muted">
                    קווי מוצרים
                  </p>
                  {view.cats.map((c) => (
                    <Link
                      key={`c${c.id}`}
                      href={`/category/${c.id}/`}
                      data-idx={c.idx}
                      onClick={pick}
                      onMouseEnter={() => setActive(c.idx)}
                      className={`flex items-center gap-3 px-4 py-2 text-sm ${active === c.idx ? "bg-soft" : ""}`}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-soft text-base">
                        {c.icon}
                      </span>
                      <span className="flex-1 truncate font-semibold text-heading">
                        {c.name}
                        {c.top && <span className="ms-1 text-xs font-normal text-muted">· {c.top}</span>}
                      </span>
                      <span className="shrink-0 text-xs text-muted">{c.count} מוצרים</span>
                    </Link>
                  ))}
                </div>
              )}

              {view.groups.map((g) => (
                <div key={`g${g.id}`} className="border-t border-line pt-1">
                  <Link
                    href={`/category/${g.id}/`}
                    data-idx={g.headerIdx}
                    onClick={pick}
                    onMouseEnter={() => setActive(g.headerIdx)}
                    className={`flex items-center gap-2 px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-wide ${active === g.headerIdx ? "text-brand-red" : "text-muted"}`}
                  >
                    <span>{g.icon}</span>
                    <span className="flex-1 truncate">{g.name}</span>
                    <span className="font-normal normal-case text-brand-red">לכל הקו ←</span>
                  </Link>
                  {g.items.map((p) => (
                    <Link
                      key={`p${p.id}`}
                      href={`/product/${p.id}/`}
                      data-idx={p.idx}
                      onClick={pick}
                      onMouseEnter={() => setActive(p.idx)}
                      className={`flex items-center gap-3 px-4 py-2 ${active === p.idx ? "bg-soft" : ""}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image}
                        alt=""
                        loading="lazy"
                        className="h-11 w-11 shrink-0 rounded-md border border-line bg-white object-contain p-0.5"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink">{p.name}</span>
                        {p.model && <span className="block text-xs text-muted">דגם {p.model}</span>}
                      </span>
                      <span className="shrink-0 text-sm font-bold text-brand-red">{ils(p.price)}</span>
                    </Link>
                  ))}
                </div>
              ))}

              <Link
                href={allResultsHref}
                data-idx={view.allIdx}
                onClick={pick}
                onMouseEnter={() => setActive(view.allIdx)}
                className={`mt-1 block border-t border-line px-4 py-2.5 text-center text-sm font-bold ${active === view.allIdx ? "bg-soft text-brand-red-dark" : "text-brand-red"}`}
              >
                כל התוצאות עבור ״{query.trim()}״{view.total > 0 ? ` (${view.total})` : ""} ←
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
