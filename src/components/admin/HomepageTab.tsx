"use client";

import { useEffect, useRef, useState } from "react";
import type {
  Homepage,
  Category,
  PromoTile,
  HomeSection,
  DealsCube,
  DealFace,
  Product,
} from "@/lib/types";
import { apiGet, apiSend, uploadImage, adminPreviewSrc, formatPrice, type ProductList } from "./lib";
import { Field, TextArea, Button, Toggle } from "./ui";

// Deep clone via JSON (homepage data is plain JSON) for the save-merge baseline.
function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function ImageUpload({
  label,
  value,
  onUploaded,
  onError,
}: {
  label: string;
  value: string;
  onUploaded: (path: string) => void;
  onError: (msg: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  // Local object-URL preview of the just-picked file. Shown immediately so the
  // thumbnail isn't a broken 404 during the ~2–3 min CI publish window (the
  // committed path isn't served from this origin until the rebuild finishes).
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [justUploaded, setJustUploaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setJustUploaded(false);
    setImgError(false);
    const preview = URL.createObjectURL(file);
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return preview;
    });
    try {
      const path = await uploadImage("banner", file);
      onUploaded(path);
      setJustUploaded(true);
    } catch (e) {
      onError((e as Error).message);
      URL.revokeObjectURL(preview);
      setLocalPreview(null);
    } finally {
      setBusy(false);
    }
  }

  // Prefer the just-picked local blob; otherwise preview the committed image
  // from GitHub raw (available within seconds of commit, unlike this origin).
  const previewSrc = localPreview || adminPreviewSrc(value);

  useEffect(() => {
    setImgError(false);
  }, [previewSrc]);

  return (
    <div>
      <span className="mb-1 block text-sm font-semibold text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-gray-50">
          {previewSrc && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt=""
              className="h-full w-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : value ? (
            <span className="px-1 text-center text-[10px] leading-tight text-gray-400">🕓 מתפרסם…</span>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <Button variant="ghost" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? "מעלה…" : "העלאת תמונה"}
        </Button>
      </div>
      {justUploaded ? (
        <p className="mt-1 text-xs text-emerald-700">
          ✓ התמונה נשמרה. שמרו ופרסמו — היא תופיע באתר תוך 2–3 דקות (זמן פרסום).
        </p>
      ) : null}
      <Field label="" value={value} onChange={() => {}} dir="ltr" hint="נתיב התמונה (מתעדכן אוטומטית לאחר העלאה)" />
    </div>
  );
}

// Search-as-you-type product picker. Filters the catalog by name/model/id and,
// on selection, hands the chosen product back so the caller can autofill a deal.
function ProductPicker({
  products,
  onPick,
}: {
  products: Product[];
  onPick: (p: Product) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const term = q.trim().toLowerCase();
  const matches = term
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            String(p.model).toLowerCase().includes(term) ||
            String(p.id).includes(term)
        )
        .slice(0, 8)
    : [];

  return (
    <div ref={boxRef} className="relative">
      <span className="mb-1 block text-sm font-semibold text-gray-700">בחירת מוצר מהקטלוג</span>
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="חיפוש לפי שם / דגם / מק״ט…"
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-base sm:text-sm text-gray-900 shadow-sm outline-none focus:border-brand-red"
      />
      {open && matches.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-line bg-white shadow-lg">
          {matches.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(p);
                  setQ("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-right hover:bg-gray-50"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded border border-line bg-gray-50">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={adminPreviewSrc(p.image)} alt="" className="h-full w-full object-contain" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gray-900">{p.name}</span>
                  <span className="block text-xs text-gray-500">
                    #{p.id} · {formatPrice(p.onSale && p.salePrice ? p.salePrice : p.price)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function HomepageTab({
  onToast,
}: {
  onToast: (msg: string, ok: boolean) => void;
}) {
  const [hp, setHp] = useState<Homepage | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [rawText, setRawText] = useState("");
  // Snapshot of the homepage exactly as it was loaded. Used at save time to tell
  // which top-level regions THIS session actually edited, so we never clobber a
  // region (e.g. promo tiles) that changed on the server after we loaded.
  const baseRef = useRef<Homepage | null>(null);

  useEffect(() => {
    apiGet<Homepage>("/api/homepage")
      .then((d) => {
        setHp(d);
        baseRef.current = clone(d);
      })
      .catch((e: Error) => onToast(e.message, false));
    apiGet<Category[]>("/api/categories").then(setCats).catch(() => {});
    apiGet<ProductList>("/api/products").then((d) => setProducts(d.products)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hp) return <p className="p-8 text-gray-500">טוען…</p>;

  function setHero<K extends keyof Homepage["hero"]>(k: K, v: Homepage["hero"][K]) {
    setHp((s) => (s ? { ...s, hero: { ...s.hero, [k]: v } } : s));
  }
  function setTile(i: number, patch: Partial<PromoTile>) {
    setHp((s) =>
      s ? { ...s, promoTiles: s.promoTiles.map((t, j) => (j === i ? { ...t, ...patch } : t)) } : s
    );
  }
  function setSection(i: number, patch: Partial<HomeSection>) {
    setHp((s) =>
      s ? { ...s, sections: s.sections.map((t, j) => (j === i ? { ...t, ...patch } : t)) } : s
    );
  }
  function addTile() {
    setHp((s) =>
      s
        ? {
            ...s,
            promoTiles: [
              ...s.promoTiles,
              { id: `t-${Date.now()}`, title: "אריח חדש", image: "", categoryId: 0 },
            ],
          }
        : s
    );
  }
  function removeTile(i: number) {
    setHp((s) => (s ? { ...s, promoTiles: s.promoTiles.filter((_, j) => j !== i) } : s));
  }
  function addSection() {
    setHp((s) =>
      s
        ? {
            ...s,
            sections: [
              ...s.sections,
              {
                id: `s-${Date.now()}`,
                title: "מקטע חדש",
                icon: "✨",
                categoryId: 0,
                limit: 12,
                layout: "carousel",
              },
            ],
          }
        : s
    );
  }
  function removeSection(i: number) {
    setHp((s) => (s ? { ...s, sections: s.sections.filter((_, j) => j !== i) } : s));
  }

  // --- Deals cube helpers ---
  const cube: DealsCube = hp.dealsCube ?? { enabled: false, intervalMs: 4500, faces: [] };
  function setCube(patch: Partial<DealsCube>) {
    setHp((s) => (s ? { ...s, dealsCube: { ...cube, ...patch } } : s));
  }
  function setFace(i: number, patch: Partial<DealFace>) {
    setCube({ faces: cube.faces.map((f, j) => (j === i ? { ...f, ...patch } : f)) });
  }
  function addFace() {
    setCube({
      faces: [
        ...cube.faces,
        { id: `deal-${Date.now()}`, title: "מבצע חדש", image: "", dealPrice: 0, href: "" },
      ],
    });
  }
  function removeFace(i: number) {
    setCube({ faces: cube.faces.filter((_, j) => j !== i) });
  }
  function moveFace(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= cube.faces.length) return;
    const next = cube.faces.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setCube({ faces: next });
  }
  function pickForFace(i: number, p: Product) {
    const onSale = p.onSale && p.salePrice > 0 && p.regularPrice > p.salePrice;
    setFace(i, {
      productId: p.id,
      title: p.name,
      image: p.image,
      href: `/product/${p.id}/`,
      dealPrice: onSale ? p.salePrice : p.price || p.regularPrice,
      originalPrice: onSale ? p.regularPrice : undefined,
    });
  }

  async function save() {
    if (!hp) return;
    setSaving(true);
    try {
      // Lost-update safe save. We send the full homepage we hold PLUS the list of
      // top-level regions this session actually edited (vs the baseline we loaded).
      // The server re-reads the latest commit and overwrites ONLY those regions,
      // so editing the Hero can't revert promo tiles another admin/process changed.
      // The merge happens on the SERVER (against a guaranteed-fresh read), so even
      // a flaky client network can't make us clobber newer data with a stale copy.
      const base = baseRef.current;
      let body: unknown = hp;
      if (base) {
        const changedKeys = (Object.keys(hp) as (keyof Homepage)[])
          .filter((k) => JSON.stringify(hp[k]) !== JSON.stringify(base[k]))
          .map((k) => String(k));
        body = { homepage: hp, changedKeys };
      }
      await apiSend("/api/homepage", "PUT", body);
      // Re-sync to the authoritative server copy so the editor (and our baseline)
      // reflect the merged result, including any regions another session changed.
      const latest = await apiGet<Homepage>("/api/homepage").catch(() => hp);
      setHp(latest);
      baseRef.current = clone(latest);
      onToast("עמוד הבית נשמר — האתר יתעדכן בעוד דקה־שתיים", true);
    } catch (e) {
      onToast((e as Error).message, false);
    } finally {
      setSaving(false);
    }
  }

  function catOptions(value: number, onChange: (v: number) => void) {
    return (
      <select
        value={String(value || 0)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-base sm:text-sm text-gray-900 shadow-sm outline-none focus:border-brand-red"
      >
        <option value="0">— קטגוריה —</option>
        {cats.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} (#{c.id})
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="mb-4 text-lg font-extrabold text-heading">באנר ראשי (Hero)</h2>
        <div className="space-y-4">
          <ImageUpload
            label="תמונת הבאנר"
            value={hp.hero.image}
            onUploaded={(p) => {
              setHero("image", p);
              onToast("התמונה הועלתה. לחצו שמירה כדי לפרסם.", true);
            }}
            onError={(m) => onToast(m, false)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="טקסט חלופי (Alt · ל־SEO)" value={hp.hero.alt} onChange={(v) => setHero("alt", v)} />
            <Field label="קישור בלחיצה" value={hp.hero.href} onChange={(v) => setHero("href", v)} dir="ltr" hint="לדוגמה /category/146/" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="mb-4 text-lg font-extrabold text-heading">הודעת מבצע ופרטי טופבר</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="הודעת רצועה עליונה" value={hp.announcement} onChange={(v) => setHp((s) => (s ? { ...s, announcement: v } : s))} />
          <Field label="טלפון בטופבר" value={hp.topbarPhone} onChange={(v) => setHp((s) => (s ? { ...s, topbarPhone: v } : s))} dir="ltr" />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-heading">🔥 קוביית מבצעים</h2>
          <div className="flex items-center gap-4">
            <Toggle
              label="מוצגת באתר"
              checked={!!cube.enabled}
              onChange={(v) => setCube({ enabled: v })}
            />
            <Button variant="subtle" onClick={addFace} disabled={cube.faces.length >= 6}>
              + פאה
            </Button>
          </div>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          קובייה מסתובבת מעל אריחי הקידום. מומלצות 4 פאות. כל פאה = מבצע על מוצר: בחרו מוצר
          מהקטלוג והפרטים ימולאו אוטומטית; הזינו מחיר מבצע (ומחיר מקורי כדי להציג הנחה).
        </p>

        <div className="mb-4 max-w-xs">
          <Field
            label="מהירות החלפה (שניות)"
            type="number"
            value={String(Math.round((cube.intervalMs ?? 4500) / 1000))}
            onChange={(v) => setCube({ intervalMs: Math.max(2, Number(v) || 4.5) * 1000 })}
            hint="כמה שניות כל פאה מוצגת לפני הסיבוב"
          />
        </div>

        {cube.faces.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line bg-gray-50 p-4 text-center text-sm text-gray-500">
            אין מבצעים עדיין. לחצו “+ פאה” כדי להוסיף מבצע ראשון.
          </p>
        ) : (
          <div className="space-y-4">
            {cube.faces.map((f, i) => {
              const hasDeal = typeof f.originalPrice === "number" && f.originalPrice > f.dealPrice;
              return (
                <div key={f.id} className="rounded-xl border border-line bg-gray-50 p-3 sm:p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-heading">פאה {i + 1}</span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" onClick={() => moveFace(i, -1)} disabled={i === 0}>↑</Button>
                      <Button variant="ghost" onClick={() => moveFace(i, 1)} disabled={i === cube.faces.length - 1}>↓</Button>
                      <Button variant="danger" onClick={() => removeFace(i)}>מחיקה</Button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <ProductPicker products={products} onPick={(p) => pickForFace(i, p)} />
                      <Field label="כותרת" value={f.title} onChange={(v) => setFace(i, { title: v })} />
                      <div className="grid grid-cols-2 gap-3">
                        <Field
                          label="מחיר מקורי (₪)"
                          type="number"
                          value={f.originalPrice != null ? String(f.originalPrice) : ""}
                          onChange={(v) =>
                            setFace(i, { originalPrice: v.trim() === "" ? undefined : Number(v) || 0 })
                          }
                          hint="ריק = ללא הנחה"
                        />
                        <Field
                          label="מחיר מבצע (₪)"
                          type="number"
                          value={String(f.dealPrice)}
                          onChange={(v) => setFace(i, { dealPrice: Number(v) || 0 })}
                        />
                      </div>
                      <Field
                        label="קישור בלחיצה"
                        value={f.href}
                        onChange={(v) => setFace(i, { href: v })}
                        dir="ltr"
                        hint="לדוגמה /product/36189/"
                      />
                    </div>

                    <div className="space-y-2">
                      <ImageUpload
                        label="תמונה (ברירת מחדל: תמונת המוצר)"
                        value={f.image}
                        onUploaded={(p) => setFace(i, { image: p })}
                        onError={(m) => onToast(m, false)}
                      />
                      <div className="rounded-lg border border-line bg-white p-3 text-right">
                        <p className="truncate text-sm font-extrabold text-gray-900">{f.title || "—"}</p>
                        <p className="mt-1">
                          {hasDeal && (
                            <span className="ml-2 text-xs text-gray-400 line-through">
                              {formatPrice(f.originalPrice as number)}
                            </span>
                          )}
                          <span className="text-lg font-black text-brand-red">{formatPrice(f.dealPrice || 0)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-heading">אריחי קידום (Promo Tiles)</h2>
          <Button variant="subtle" onClick={addTile}>+ אריח</Button>
        </div>
        <div className="space-y-4">
          {hp.promoTiles.map((t, i) => (
            <div key={t.id} className="grid items-end gap-3 rounded-lg border border-line bg-gray-50 p-3 sm:grid-cols-[7rem_1fr_1fr_auto]">
              <ImageUpload
                label="תמונה"
                value={t.image}
                onUploaded={(p) => setTile(i, { image: p })}
                onError={(m) => onToast(m, false)}
              />
              <Field label="כותרת" value={t.title} onChange={(v) => setTile(i, { title: v })} />
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-gray-700">קטגוריה</span>
                {catOptions(t.categoryId, (v) => setTile(i, { categoryId: v }))}
              </label>
              <Button variant="danger" onClick={() => removeTile(i)}>מחיקה</Button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-heading">מקטעי מוצרים בעמוד הבית</h2>
          <Button variant="subtle" onClick={addSection}>+ מקטע</Button>
        </div>
        <div className="space-y-4">
          {hp.sections.map((sec, i) => (
            <div key={sec.id} className="grid items-end gap-3 rounded-lg border border-line bg-gray-50 p-3 sm:grid-cols-[auto_1fr_1fr_5rem_auto]">
              <Field label="אייקון" value={sec.icon} onChange={(v) => setSection(i, { icon: v })} />
              <Field label="כותרת" value={sec.title} onChange={(v) => setSection(i, { title: v })} />
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-gray-700">קטגוריה</span>
                {catOptions(sec.categoryId, (v) => setSection(i, { categoryId: v }))}
              </label>
              <Field label="מקסימום" type="number" value={String(sec.limit)} onChange={(v) => setSection(i, { limit: Number(v) || 0 })} />
              <Button variant="danger" onClick={() => removeSection(i)}>מחיקה</Button>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? "שומר…" : "שמירת עמוד הבית"}</Button>
        <Button
          variant="ghost"
          onClick={() => {
            setRawText(JSON.stringify(hp, null, 2));
            setShowRaw((v) => !v);
          }}
        >
          עריכה מתקדמת (JSON)
        </Button>
      </div>

      {showRaw ? (
        <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
          <textarea
            value={rawText}
            dir="ltr"
            rows={16}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full rounded-lg border border-line bg-gray-50 p-3 font-mono text-xs text-gray-900"
          />
          <div className="mt-3 flex gap-2">
            <Button
              variant="subtle"
              onClick={() => {
                try {
                  setHp(JSON.parse(rawText) as Homepage);
                  setShowRaw(false);
                  onToast("עודכן מ־JSON. לחצו שמירה כדי לפרסם.", true);
                } catch {
                  onToast("JSON לא תקין", false);
                }
              }}
            >
              החלה
            </Button>
            <Button variant="ghost" onClick={() => setShowRaw(false)}>ביטול</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
