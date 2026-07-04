"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { LineIcon } from "@/lib/lineIcons";
import type { Product } from "@/lib/types";

type IndexProduct = {
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

type Sort = "deals" | "new" | "popular";
type Criteria = { cats?: number[]; min?: number; max?: number; sort?: Sort };
type Opt = { key: string; label: string; icon: string; crit: Criteria };
type Q = { key: string; title: string; cols: string; options: Opt[] };
type Flow = { key: string; steps: Q[] };

// Three interchangeable question flows. A returning visitor is served a
// different flow each time (see variant rotation below). Every option carries a
// partial `crit`; the engine merges the chosen options and filters/sorts once.
const FLOWS: Flow[] = [
  {
    key: "classic",
    steps: [
      {
        key: "area",
        title: "מה מעניין אתכם עכשיו?",
        cols: "grid-cols-2 sm:grid-cols-4",
        options: [
          { key: "home", label: "מוצרים לבית", icon: "sofa", crit: { cats: [100] } },
          { key: "electronics", label: "אלקטרוניקה", icon: "electric", crit: { cats: [200] } },
          { key: "fashion", label: "אופנה", icon: "gift", crit: { cats: [300] } },
          { key: "leisure", label: "פנאי", icon: "star", crit: { cats: [400] } },
        ],
      },
      {
        key: "budget",
        title: "מה טווח התקציב?",
        cols: "grid-cols-2",
        options: [
          { key: "u100", label: "עד ₪100", icon: "coin", crit: { min: 0, max: 100 } },
          { key: "m", label: "₪100–300", icon: "wallet", crit: { min: 100, max: 300 } },
          { key: "p300", label: "מעל ₪300", icon: "gem", crit: { min: 300, max: Infinity } },
          { key: "any", label: "גמיש / הכל", icon: "gauge", crit: { min: 0, max: Infinity } },
        ],
      },
      {
        key: "pref",
        title: "מה הכי חשוב לכם?",
        cols: "grid-cols-1 sm:grid-cols-3",
        options: [
          { key: "deals", label: "הכי משתלם", icon: "tag", crit: { sort: "deals" } },
          { key: "new", label: "החדש ביותר", icon: "sparkle", crit: { sort: "new" } },
          { key: "popular", label: "מבחר מומלץ", icon: "star", crit: { sort: "popular" } },
        ],
      },
    ],
  },
  {
    key: "use",
    steps: [
      {
        key: "need",
        title: "לאיזו מטרה מחפשים?",
        cols: "grid-cols-2 sm:grid-cols-4",
        options: [
          { key: "daily", label: "שימוש יומיומי בבית", icon: "sofa", crit: { cats: [100] } },
          { key: "tech", label: "גאדג׳טים ואביזרים", icon: "electric", crit: { cats: [200] } },
          { key: "style", label: "סטייל אישי", icon: "sparkle", crit: { cats: [300] } },
          { key: "fun", label: "בילוי וספורט", icon: "star", crit: { cats: [400] } },
        ],
      },
      {
        key: "occasion",
        title: "מה מטרת הקנייה?",
        cols: "grid-cols-1 sm:grid-cols-3",
        options: [
          { key: "gift", label: "מתנה למישהו", icon: "gift", crit: { sort: "popular" } },
          { key: "upgrade", label: "שדרוג לעצמי", icon: "upgrade", crit: { sort: "new" } },
          { key: "basic", label: "קנייה משתלמת", icon: "refresh", crit: { sort: "deals" } },
        ],
      },
      {
        key: "style",
        title: "איזה תקציב מתאים לכם?",
        cols: "grid-cols-2",
        options: [
          { key: "save", label: "חסכוני", icon: "coin", crit: { min: 0, max: 100 } },
          { key: "balanced", label: "מאוזן", icon: "wallet", crit: { min: 100, max: 250 } },
          { key: "premium", label: "פרימיום", icon: "gem", crit: { min: 250, max: Infinity } },
          { key: "flex", label: "גמיש", icon: "gauge", crit: { min: 0, max: Infinity } },
        ],
      },
    ],
  },
  {
    key: "priority",
    steps: [
      {
        key: "priority",
        title: "מה תרצו לראות קודם?",
        cols: "grid-cols-2 sm:grid-cols-4",
        options: [
          { key: "home", label: "פריטים לבית", icon: "sofa", crit: { cats: [100] } },
          { key: "electronics", label: "מוצרי טכנולוגיה", icon: "electric", crit: { cats: [200] } },
          { key: "fashion", label: "אופנה ואביזרים", icon: "gift", crit: { cats: [300] } },
          { key: "leisure", label: "פנאי ומשחקים", icon: "star", crit: { cats: [400] } },
        ],
      },
      {
        key: "invest",
        title: "כמה תרצו להשקיע?",
        cols: "grid-cols-2",
        options: [
          { key: "min", label: "מינימלי", icon: "coin", crit: { min: 0, max: 80 } },
          { key: "mid", label: "בינוני", icon: "wallet", crit: { min: 80, max: 200 } },
          { key: "max", label: "לא מתפשרים", icon: "gem", crit: { min: 200, max: Infinity } },
          { key: "depends", label: "תלוי במוצר", icon: "gauge", crit: { min: 0, max: Infinity } },
        ],
      },
      {
        key: "prefer",
        title: "מה תעדיפו לראות?",
        cols: "grid-cols-1 sm:grid-cols-3",
        options: [
          { key: "new", label: "הכי חדש", icon: "sparkle", crit: { sort: "new" } },
          { key: "popular", label: "הכי מומלץ", icon: "star", crit: { sort: "popular" } },
          { key: "deals", label: "הכי משתלם", icon: "tag", crit: { sort: "deals" } },
        ],
      },
    ],
  },
];

const VARIANT_KEY = "store-finder-v";
const RESULT_LIMIT = 12;

function toProduct(p: IndexProduct): Product {
  return {
    id: p.id,
    name: p.name,
    model: p.model,
    price: p.price,
    regularPrice: p.regularPrice ?? p.price,
    salePrice: p.salePrice ?? p.price,
    onSale: !!p.onSale,
    image: p.image,
    categoryIds: [p.groupId],
    inStock: p.inStock !== false,
    description: "",
  };
}

export default function FinderClient() {
  const [all, setAll] = useState<IndexProduct[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [variant, setVariant] = useState(0);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(Opt | null)[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const flow = FLOWS[variant % FLOWS.length];
  const stepsCount = flow.steps.length;

  // Load catalog once.
  useEffect(() => {
    let alive = true;
    fetch("/search-index.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (alive) setAll(Array.isArray(data.products) ? data.products : []);
      })
      .catch(() => {
        if (alive) setLoadError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Serve a returning visitor a different flow: read the stored index on mount.
  useEffect(() => {
    try {
      const n = parseInt(localStorage.getItem(VARIANT_KEY) || "", 10);
      if (!Number.isNaN(n)) setVariant(n);
    } catch {
      /* ignore */
    }
  }, []);

  // Once results are reached, remember to advance the flow for next time.
  useEffect(() => {
    if (step === stepsCount) {
      try {
        localStorage.setItem(VARIANT_KEY, String(variant + 1));
      } catch {
        /* ignore */
      }
    }
  }, [step, stepsCount, variant]);

  const { list, relaxed, total, catOpt } = useMemo(() => {
    const empty = { list: [] as Product[], relaxed: false, total: 0, catOpt: null as Opt | null };
    if (!all || step !== stepsCount) return empty;
    const chosen = flow.steps.map((_, i) => answers[i]).filter(Boolean) as Opt[];
    if (chosen.length < stepsCount) return empty;

    const crit: Criteria = {};
    for (const o of chosen) {
      if (o.crit.cats) crit.cats = crit.cats ? Array.from(new Set([...crit.cats, ...o.crit.cats])) : [...o.crit.cats];
      if (o.crit.min != null) crit.min = o.crit.min;
      if (o.crit.max != null) crit.max = o.crit.max;
      if (o.crit.sort) crit.sort = o.crit.sort;
    }

    const inArea = all.filter((p) => p.price > 0 && (!crit.cats || crit.cats.includes(p.groupId)));
    const min = crit.min ?? 0;
    const max = crit.max ?? Infinity;
    let scoped = inArea.filter((p) => p.price >= min && p.price <= max);
    let didRelax = false;
    if (scoped.length === 0 && (min > 0 || max !== Infinity)) {
      scoped = inArea;
      didRelax = true;
    }

    const sortKey = crit.sort ?? "popular";
    const sorted = [...scoped].sort((a, b) => {
      const stock = Number(b.inStock !== false) - Number(a.inStock !== false);
      if (stock !== 0) return stock;
      if (sortKey === "deals") {
        const sale = Number(b.onSale) - Number(a.onSale);
        if (sale !== 0) return sale;
        return a.price - b.price;
      }
      return b.id - a.id; // new + popular → newest id first
    });

    return {
      list: sorted.slice(0, RESULT_LIMIT).map(toProduct),
      relaxed: didRelax,
      total: scoped.length,
      catOpt: chosen.find((o) => o.crit.cats) ?? null,
    };
  }, [all, answers, step, stepsCount, flow]);

  function pick(i: number, opt: Opt) {
    const next = [...answers];
    next[i] = opt;
    setAnswers(next);
    setStep(i + 1);
  }

  function scrollToTop() {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // Wait for the re-render (results grid removed → page shrinks) before scrolling,
    // otherwise the browser leaves us clamped at the old page bottom.
    requestAnimationFrame(() => {
      const top = rootRef.current
        ? rootRef.current.getBoundingClientRect().top + window.scrollY - 80
        : 0;
      window.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
    });
  }

  function restart() {
    setAnswers([]);
    setStep(0);
    setVariant((v) => v + 1);
    scrollToTop();
  }

  return (
    <div ref={rootRef} className="container-x py-8">
      {/* header */}
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-red/10 text-brand-red">
          <LineIcon name="compass" className="h-7 w-7" />
        </span>
        <h1 className="mt-3 text-2xl font-extrabold text-heading md:text-3xl">מצאו את המוצר המושלם</h1>
        <p className="mt-2 text-sm text-muted md:text-base">
          כמה שאלות קצרות ונרכיב לכם המלצה אישית מתוך קטלוג הדוגמה.
        </p>
      </div>

      {/* progress */}
      {step < stepsCount && (
        <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2">
          {Array.from({ length: stepsCount }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-brand-red" : "bg-black/10"
              }`}
            />
          ))}
        </div>
      )}

      <div className="mx-auto mt-8 max-w-3xl">
        {step < stepsCount ? (
          <Question
            title={flow.steps[step].title}
            onBack={step > 0 ? () => setStep(step - 1) : undefined}
          >
            <div className={`grid gap-3 ${flow.steps[step].cols}`}>
              {flow.steps[step].options.map((opt) => (
                <TileButton
                  key={opt.key}
                  icon={opt.icon}
                  label={opt.label}
                  active={answers[step]?.key === opt.key}
                  onClick={() => pick(step, opt)}
                />
              ))}
            </div>
          </Question>
        ) : (
          <div>
            {loadError ? (
              <p className="py-10 text-center text-sm text-muted">
                אירעה תקלה בטעינת המוצרים. נסו לרענן את העמוד.
              </p>
            ) : !all ? (
              <p className="py-10 text-center text-sm text-muted">טוען המלצות…</p>
            ) : list.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-muted">לא מצאנו התאמה מדויקת. ננסה שוב?</p>
                <button
                  onClick={restart}
                  className="mt-4 inline-flex items-center gap-2 rounded-md bg-brand-red px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-red-dark"
                >
                  <LineIcon name="refresh" className="h-4 w-4" />
                  להתחיל מחדש
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center text-center">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-red/10 text-brand-red">
                    <LineIcon name="check" className="h-6 w-6" />
                  </span>
                  <p className="mt-2 text-lg font-extrabold text-heading">
                    מצאנו {total} מוצרים בשבילכם
                  </p>
                  {relaxed && (
                    <p className="mt-1 text-xs text-muted">
                      הרחבנו מעט את טווח התקציב כדי להראות לכם את ההתאמות הקרובות ביותר.
                    </p>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {list.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  {catOpt && catOpt.crit.cats && (
                    <Link
                      href={`/category/${catOpt.crit.cats[0]}/`}
                      className="rounded-md border-2 border-brand-red px-5 py-2.5 text-sm font-bold text-brand-red hover:bg-brand-red hover:text-white"
                    >
                      לכל המוצרים ב{catOpt.label} ←
                    </Link>
                  )}
                  <button
                    onClick={restart}
                    className="inline-flex items-center gap-2 rounded-md bg-brand-red px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-red-dark"
                  >
                    <LineIcon name="refresh" className="h-4 w-4" />
                    התאמה חדשה
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Question({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-5 flex items-center justify-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="חזרה"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-black/10 text-muted hover:border-brand-red hover:text-brand-red"
          >
            →
          </button>
        )}
        <h2 className="text-center text-lg font-extrabold text-heading md:text-xl">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function TileButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex min-h-[6.5rem] flex-col items-center justify-center gap-2.5 rounded-xl border bg-white p-4 text-center transition-all hover:-translate-y-0.5 hover:border-brand-red hover:shadow-md ${
        active ? "border-brand-red shadow-md ring-1 ring-brand-red" : "border-black/10"
      }`}
    >
      <span
        className={`grid h-12 w-12 place-items-center rounded-full text-brand-red transition-colors ${
          active ? "bg-brand-red/15" : "bg-brand-red/10"
        }`}
      >
        <LineIcon name={icon} className="h-7 w-7" />
      </span>
      <span className="text-sm font-bold text-heading">{label}</span>
    </button>
  );
}
