"use client";

import { useEffect, useMemo, useState } from "react";
import type { Category, Coupon } from "@/lib/types";
import { apiGet, apiSend } from "./lib";
import { Field, TextArea, Toggle, Button, CategorySelect, SectionCard } from "./ui";

type Draft = {
  code: string;
  title: string;
  type: "percent" | "fixed";
  value: string;
  scope: "all" | "category" | "products";
  categoryId: number;
  productIds: string;
  minSubtotal: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
  visibility: "public" | "hidden";
  stackable: boolean;
  terms: string;
};

const EMPTY: Draft = {
  code: "",
  title: "",
  type: "percent",
  value: "",
  scope: "all",
  categoryId: 0,
  productIds: "",
  minSubtotal: "",
  startsAt: "",
  endsAt: "",
  active: true,
  visibility: "public",
  stackable: false,
  terms: "",
};

function toDraft(c: Coupon): Draft {
  return {
    code: c.code,
    title: c.title,
    type: c.type,
    value: String(c.value ?? ""),
    scope: c.scope,
    categoryId: c.categoryId || 0,
    productIds: (c.productIds || []).join(", "),
    minSubtotal: c.minSubtotal ? String(c.minSubtotal) : "",
    startsAt: c.startsAt || "",
    endsAt: c.endsAt || "",
    active: c.active !== false,
    visibility: c.visibility === "hidden" ? "hidden" : "public",
    stackable: !!c.stackable,
    terms: c.terms || "",
  };
}

function toPayload(d: Draft) {
  return {
    code: d.code.trim().toUpperCase(),
    title: d.title.trim(),
    type: d.type,
    value: Number(d.value) || 0,
    scope: d.scope,
    categoryId: d.scope === "category" ? d.categoryId : 0,
    productIds:
      d.scope === "products"
        ? d.productIds
            .split(",")
            .map((s) => Number(s.trim()))
            .filter((n) => n > 0)
        : [],
    minSubtotal: Number(d.minSubtotal) || 0,
    startsAt: d.startsAt,
    endsAt: d.endsAt,
    active: d.active,
    visibility: d.visibility,
    stackable: d.stackable,
    terms: d.terms.trim(),
  };
}

export default function CouponsTab({
  onToast,
}: {
  onToast: (msg: string, ok: boolean) => void;
}) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [togglingSystem, setTogglingSystem] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [cps, cs, settings] = await Promise.all([
        apiGet<Coupon[]>("/api/coupons"),
        apiGet<Category[]>("/api/categories"),
        apiGet<{ enabled: boolean }>("/api/coupon-settings").catch(() => ({
          enabled: true,
        })),
      ]);
      setCoupons(cps);
      setCats(cs);
      setEnabled(settings?.enabled !== false);
    } catch (e) {
      onToast((e as Error).message, false);
    } finally {
      setLoading(false);
    }
  }

  async function toggleSystem(next: boolean) {
    setTogglingSystem(true);
    // optimistic — revert on failure
    const prev = enabled;
    setEnabled(next);
    try {
      const saved = await apiSend<{ enabled: boolean }>(
        "/api/coupon-settings",
        "PUT",
        { enabled: next },
      );
      setEnabled(saved?.enabled !== false);
      onToast(
        next
          ? "מערכת הקופונים הופעלה — האתר יתעדכן בעוד דקה־שתיים"
          : "מערכת הקופונים כובתה — לא יוצגו קופונים באתר. האתר יתעדכן בעוד דקה־שתיים",
        true,
      );
    } catch (e) {
      setEnabled(prev);
      onToast((e as Error).message, false);
    } finally {
      setTogglingSystem(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const catName = useMemo(() => {
    const m = new Map<number, string>();
    cats.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [cats]);

  function startCreate() {
    setEditId(null);
    setDraft(EMPTY);
  }

  function startEdit(c: Coupon) {
    setEditId(c.id);
    setDraft(toDraft(c));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function set<K extends keyof Draft>(key: K, val: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: val }));
  }

  async function save() {
    if (!draft.code.trim()) {
      onToast("יש להזין קוד קופון", false);
      return;
    }
    if (!(Number(draft.value) > 0)) {
      onToast("יש להזין ערך הנחה חיובי", false);
      return;
    }
    setSaving(true);
    try {
      const payload = toPayload(draft);
      if (editId) {
        await apiSend<Coupon>(`/api/coupons/${editId}`, "PUT", payload);
        onToast("הקופון עודכן — האתר יתעדכן בעוד דקה־שתיים", true);
      } else {
        await apiSend<Coupon>("/api/coupons", "POST", payload);
        onToast("הקופון נוצר — האתר יתעדכן בעוד דקה־שתיים", true);
      }
      startCreate();
      await load();
    } catch (e) {
      onToast((e as Error).message, false);
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: Coupon) {
    if (!confirm(`למחוק את הקופון "${c.code}"? פעולה זו אינה הפיכה.`)) return;
    try {
      await apiSend(`/api/coupons/${c.id}`, "DELETE", {});
      onToast("הקופון נמחק", true);
      if (editId === c.id) startCreate();
      await load();
    } catch (e) {
      onToast((e as Error).message, false);
    }
  }

  function scopeText(c: Coupon): string {
    if (c.scope === "category") return `קטגוריה: ${catName.get(c.categoryId || 0) || "—"}`;
    if (c.scope === "products") return `מוצרים נבחרים (${(c.productIds || []).length})`;
    return "כל המוצרים";
  }

  function valueText(c: Coupon): string {
    return c.type === "percent" ? `${c.value}%` : `₪${c.value}`;
  }

  return (
    <div className="space-y-6">
      {/* Master on/off switch for the whole coupon system */}
      <SectionCard title="מערכת קופונים">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-heading">
              {enabled ? "מערכת הקופונים פעילה" : "מערכת הקופונים כבויה"}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {enabled
                ? "קופונים מוצגים באתר — באנר בעמוד הבית ושדה קוד קופון בעגלת הקניות."
                : "כשהמערכת כבויה לא מוצג שום דבר הקשור לקופונים באתר — לא באנר בעמוד הבית ולא שדה קוד קופון או הנחה בעגלה, גם אם קיימים קופונים."}
            </p>
          </div>
          <Toggle
            label={togglingSystem ? "מעדכן…" : enabled ? "פעיל" : "כבוי"}
            checked={enabled}
            onChange={(v) => {
              if (!togglingSystem) toggleSystem(v);
            }}
          />
        </div>
        {!enabled && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            ⚠️ מערכת הקופונים כבויה. ניתן עדיין לערוך ולנהל קופונים כאן, אך הם לא יוצגו ללקוחות
            עד שתפעילו את המערכת מחדש.
          </p>
        )}
      </SectionCard>

      <div className={enabled ? "space-y-6" : "space-y-6 opacity-60"}>
      <SectionCard
        title={editId ? `עריכת קופון #${editId}` : "קופון חדש"}
        action={
          editId ? (
            <Button variant="ghost" onClick={startCreate}>
              + קופון חדש
            </Button>
          ) : undefined
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="קוד קופון"
            value={draft.code}
            onChange={(v) => set("code", v.toUpperCase())}
            placeholder="WELCOME5"
            dir="ltr"
            hint="הקוד שהלקוח יקליד בעגלה. אותיות באנגלית/מספרים, ללא רווחים."
          />
          <Field
            label="כותרת להצגה"
            value={draft.title}
            onChange={(v) => set("title", v)}
            placeholder="5% הנחה ללקוחות חדשים"
          />

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">סוג הנחה</span>
            <select
              value={draft.type}
              onChange={(e) => set("type", e.target.value as Draft["type"])}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-base sm:text-sm text-gray-900 shadow-sm outline-none focus:border-brand-red"
            >
              <option value="percent">אחוז (%)</option>
              <option value="fixed">סכום קבוע (₪)</option>
            </select>
          </label>
          <Field
            label={draft.type === "percent" ? "אחוז הנחה" : "סכום הנחה (₪)"}
            value={draft.value}
            onChange={(v) => set("value", v.replace(/[^\d.]/g, ""))}
            placeholder={draft.type === "percent" ? "5" : "100"}
            dir="ltr"
          />

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">תחולה</span>
            <select
              value={draft.scope}
              onChange={(e) => set("scope", e.target.value as Draft["scope"])}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-base sm:text-sm text-gray-900 shadow-sm outline-none focus:border-brand-red"
            >
              <option value="all">כל המוצרים</option>
              <option value="category">קטגוריה מסוימת</option>
              <option value="products">מוצרים נבחרים</option>
            </select>
          </label>
          {draft.scope === "category" ? (
            <CategorySelect
              label="קטגוריה"
              value={draft.categoryId}
              onChange={(v) => set("categoryId", v)}
              categories={cats}
            />
          ) : draft.scope === "products" ? (
            <Field
              label="מזהי מוצרים"
              value={draft.productIds}
              onChange={(v) => set("productIds", v)}
              placeholder="36189, 36190"
              dir="ltr"
              hint="מזהי המוצרים (id) המופרדים בפסיק."
            />
          ) : (
            <div />
          )}

          <Field
            label="מינימום לעגלה (₪, אופציונלי)"
            value={draft.minSubtotal}
            onChange={(v) => set("minSubtotal", v.replace(/[^\d.]/g, ""))}
            placeholder="0"
            dir="ltr"
            hint="הקופון יחול רק מעל סכום עגלה זה. 0 = ללא מינימום."
          />
          <div />

          <Field
            label="בתוקף מ (אופציונלי)"
            value={draft.startsAt}
            onChange={(v) => set("startsAt", v)}
            type="date"
            dir="ltr"
          />
          <Field
            label="בתוקף עד (אופציונלי)"
            value={draft.endsAt}
            onChange={(v) => set("endsAt", v)}
            type="date"
            dir="ltr"
          />
        </div>

        <div className="mt-4">
          <TextArea
            label="תנאים / הערה (אופציונלי)"
            value={draft.terms}
            onChange={(v) => set("terms", v)}
            rows={3}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-5">
          <Toggle label="פעיל" checked={draft.active} onChange={(v) => set("active", v)} />
          <Toggle
            label="מוצג באתר (באנר בעמוד הבית)"
            checked={draft.visibility === "public"}
            onChange={(v) => set("visibility", v ? "public" : "hidden")}
          />
          <Toggle
            label="ניתן לשילוב עם מבצעים"
            checked={draft.stackable}
            onChange={(v) => set("stackable", v)}
          />
          <div className="ms-auto">
            <Button onClick={save} disabled={saving}>
              {saving ? "שומר…" : editId ? "שמירת שינויים" : "+ יצירת קופון"}
            </Button>
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-400">
          הערה: אין סליקה באתר, ולכן הקופון מוצג ללקוח ומחושב בעגלה, וההנחה מאושרת בעת סגירת
          ההזמנה בטלפון או בוואטסאפ. קוד הקופון גלוי לכל הגולשים.
        </p>
      </SectionCard>

      {/* list */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-heading">קופונים קיימים</h3>
          <span className="text-sm text-gray-500">{coupons.length} קופונים</span>
        </div>

        {loading ? (
          <p className="p-8 text-gray-500">טוען קופונים…</p>
        ) : coupons.length === 0 ? (
          <p className="rounded-2xl border border-line bg-white p-8 text-center text-gray-500 shadow-card">
            עדיין אין קופונים. צרו קופון ראשון למעלה.
          </p>
        ) : (
          <div className="space-y-2">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-card"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                  <span dir="ltr" className="font-extrabold text-brand-red">
                    {c.code}
                  </span>
                  <span className="rounded-full bg-soft px-2 py-0.5 text-xs font-bold text-brand-red">
                    {valueText(c)}
                  </span>
                  <span className="truncate text-sm text-gray-600">{c.title}</span>
                  <span className="text-xs text-gray-400">{scopeText(c)}</span>
                  {!c.active && (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[0.7rem] text-gray-500">
                      כבוי
                    </span>
                  )}
                  {c.visibility === "hidden" && (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[0.7rem] text-gray-500">
                      מוסתר
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => startEdit(c)}
                    className="rounded px-2 py-1 text-xs font-bold text-gray-500 hover:bg-gray-100 hover:text-heading"
                  >
                    עריכה
                  </button>
                  <button
                    onClick={() => remove(c)}
                    className="rounded px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    מחיקה
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
