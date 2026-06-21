"use client";

import { useEffect, useMemo, useState } from "react";
import type { Category } from "@/lib/types";
import { apiGet, apiSend } from "./lib";
import { Field, Button } from "./ui";

type NewCat = { name: string; parent: number; icon: string };

export default function CategoriesTab({
  onToast,
}: {
  onToast: (msg: string, ok: boolean) => void;
}) {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<NewCat>({ name: "", parent: 0, icon: "📦" });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [filter, setFilter] = useState("");

  async function load() {
    setLoading(true);
    try {
      setCats(await apiGet<Category[]>("/api/categories"));
    } catch (e) {
      onToast((e as Error).message, false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tops = useMemo(
    () => cats.filter((c) => !c.parent).sort((a, b) => a.name.localeCompare(b.name, "he")),
    [cats]
  );
  const subsByParent = useMemo(() => {
    const m = new Map<number, Category[]>();
    cats.forEach((c) => {
      if (c.parent) {
        const arr = m.get(c.parent) || [];
        arr.push(c);
        m.set(c.parent, arr);
      }
    });
    return m;
  }, [cats]);

  const productCount = (c: Category) => c.count || 0;

  const visibleTops = useMemo(() => {
    const q = filter.trim();
    if (!q) return tops;
    return tops.filter(
      (t) =>
        t.name.includes(q) ||
        (subsByParent.get(t.id) || []).some((s) => s.name.includes(q))
    );
  }, [tops, subsByParent, filter]);

  async function create() {
    if (!draft.name.trim()) {
      onToast("יש להזין שם קטגוריה", false);
      return;
    }
    setSaving(true);
    try {
      await apiSend<Category>("/api/categories", "POST", {
        name: draft.name.trim(),
        parent: draft.parent || 0,
        icon: draft.icon.trim() || "📦",
      });
      onToast("הקטגוריה נוצרה — האתר יתעדכן בעוד דקה־שתיים", true);
      setDraft({ name: "", parent: 0, icon: "📦" });
      await load();
    } catch (e) {
      onToast((e as Error).message, false);
    } finally {
      setSaving(false);
    }
  }

  async function rename(c: Category) {
    if (!editName.trim() || editName.trim() === c.name) {
      setEditId(null);
      return;
    }
    try {
      await apiSend<Category>(`/api/categories/${c.id}`, "PUT", { name: editName.trim() });
      onToast("שם הקטגוריה עודכן", true);
      setEditId(null);
      await load();
    } catch (e) {
      onToast((e as Error).message, false);
    }
  }

  async function remove(c: Category) {
    const kids = subsByParent.get(c.id) || [];
    const extra = kids.length
      ? `\nתת-הקטגוריות שלה (${kids.length}) יהפכו לקטגוריות ראשיות.`
      : "";
    if (
      !confirm(
        `למחוק את הקטגוריה "${c.name}"?${extra}\nהמוצרים יישארו אך לא ישויכו אליה. פעולה זו אינה הפיכה.`
      )
    )
      return;
    try {
      await apiSend(`/api/categories/${c.id}`, "DELETE", {});
      onToast("הקטגוריה נמחקה", true);
      await load();
    } catch (e) {
      onToast((e as Error).message, false);
    }
  }

  function Row({ c, isSub }: { c: Category; isSub?: boolean }) {
    const editing = editId === c.id;
    return (
      <div
        className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-gray-50 ${
          isSub ? "mr-6 border-r-2 border-gray-100" : ""
        }`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-lg">{c.icon || "📦"}</span>
          {editing ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") rename(c);
                if (e.key === "Escape") setEditId(null);
              }}
              className="w-56 rounded border border-line px-2 py-1 text-sm outline-none focus:border-brand-red"
            />
          ) : (
            <span className={`truncate ${isSub ? "text-gray-600" : "font-bold text-heading"}`}>
              {c.name}
            </span>
          )}
          <span className="shrink-0 text-xs text-gray-300">#{c.id}</span>
          {productCount(c) ? (
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[0.7rem] text-gray-500">
              {productCount(c)} מוצרים
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-1">
          {editing ? (
            <>
              <Button variant="subtle" onClick={() => rename(c)}>
                שמירה
              </Button>
              <Button variant="ghost" onClick={() => setEditId(null)}>
                ביטול
              </Button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setEditId(c.id);
                  setEditName(c.name);
                }}
                className="rounded px-2 py-1 text-xs font-bold text-gray-500 hover:bg-gray-100 hover:text-heading"
              >
                שינוי שם
              </button>
              <button
                onClick={() => remove(c)}
                className="rounded px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
              >
                מחיקה
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* create */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <h3 className="mb-3 text-base font-extrabold text-heading">קטגוריה חדשה</h3>
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Field
            label="שם הקטגוריה"
            value={draft.name}
            onChange={(v) => setDraft({ ...draft, name: v })}
            placeholder="לדוגמה: מאווררים"
          />
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">
              שיוך (אופציונלי)
            </span>
            <select
              value={String(draft.parent)}
              onChange={(e) => setDraft({ ...draft, parent: Number(e.target.value) })}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-base sm:text-sm text-gray-900 shadow-sm outline-none focus:border-brand-red"
            >
              <option value="0">קטגוריה ראשית (בתפריט)</option>
              {tops.map((t) => (
                <option key={t.id} value={t.id}>
                  תת-קטגוריה של: {t.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <div className="w-20">
              <Field
                label="אייקון"
                value={draft.icon}
                onChange={(v) => setDraft({ ...draft, icon: v })}
                placeholder="📦"
              />
            </div>
            <Button onClick={create} disabled={saving}>
              {saving ? "יוצר…" : "+ הוספה"}
            </Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          קטגוריה ראשית מופיעה בתפריט העליון של האתר. תת-קטגוריה מופיעה תחת הקטגוריה הראשית
          שבחרת.
        </p>
      </div>

      {/* list */}
      <div className="flex items-center gap-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="חיפוש קטגוריה…"
          className="w-full sm:w-72 rounded-lg border border-line bg-white px-3 py-2 text-base sm:text-sm shadow-sm outline-none focus:border-brand-red"
        />
        <span className="text-sm text-gray-500">{cats.length} קטגוריות</span>
      </div>

      {loading ? (
        <p className="p-8 text-gray-500">טוען קטגוריות…</p>
      ) : (
        <div className="space-y-3">
          {visibleTops.map((t) => (
            <div
              key={t.id}
              className="overflow-hidden rounded-2xl border border-line bg-white shadow-card"
            >
              <Row c={t} />
              {(subsByParent.get(t.id) || []).length ? (
                <div className="border-t border-gray-100 bg-gray-50/40 py-1">
                  {(subsByParent.get(t.id) || [])
                    .sort((a, b) => a.name.localeCompare(b.name, "he"))
                    .map((s) => (
                      <Row key={s.id} c={s} isSub />
                    ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
