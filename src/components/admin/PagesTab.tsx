"use client";

import { useEffect, useRef, useState } from "react";
import type { AboutPageContent, AboutValue, ContentPages, ContactPageContent, LegalContentPage, LegalSection } from "@/lib/types";
import { apiGet, apiSend } from "./lib";
import { Button, Field, TextArea } from "./ui";

type PageKey = keyof ContentPages;
type LegalPageKey = "privacy" | "terms" | "returns" | "accessibility";

const LEGAL_PAGES: { slug: LegalPageKey; label: string; hint: string }[] = [
  { slug: "privacy", label: "מדיניות פרטיות", hint: "הטקסט המשפטי שמופיע בעמוד /privacy" },
  { slug: "terms", label: "תקנון האתר", hint: "תנאי השימוש והרכישה שמופיעים בעמוד /terms" },
  { slug: "returns", label: "ביטולים והחזרות", hint: "מדיניות הביטולים וההחזרות שמופיעה בעמוד /returns" },
  { slug: "accessibility", label: "הצהרת נגישות", hint: "נוסח הצהרת הנגישות שמופיע בעמוד /accessibility" },
];

const PAGE_LABELS: Record<PageKey, string> = {
  privacy: "מדיניות פרטיות",
  terms: "תקנון האתר",
  returns: "ביטולים והחזרות",
  accessibility: "הצהרת נגישות",
  about: "אודות",
  contact: "צור קשר",
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function lines(value?: string[]): string {
  return (value ?? []).join("\n");
}

function splitLines(value: string): string[] {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function optionalLines(value: string): string[] | undefined {
  const next = splitLines(value);
  return next.length ? next : undefined;
}

function changedKeysFrom(base: ContentPages | null, current: ContentPages): PageKey[] {
  if (!base) return Object.keys(current) as PageKey[];
  return (Object.keys(current) as PageKey[]).filter(
    (key) => JSON.stringify(base[key]) !== JSON.stringify(current[key])
  );
}

export default function PagesTab({
  onToast,
}: {
  onToast: (msg: string, ok: boolean) => void;
}) {
  const [pages, setPages] = useState<ContentPages | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [rawText, setRawText] = useState("");
  const baseRef = useRef<ContentPages | null>(null);
  const dirtyRef = useRef<Set<PageKey>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiGet<ContentPages>("/api/pages")
      .then((data) => {
        if (cancelled) return;
        setPages(data);
        baseRef.current = clone(data);
        dirtyRef.current.clear();
      })
      .catch((e: Error) => onToast(e.message, false))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [onToast]);

  function mark(slug: PageKey) {
    dirtyRef.current.add(slug);
  }

  function updateLegal(slug: LegalPageKey, patch: Partial<LegalContentPage>) {
    mark(slug);
    setPages((state) =>
      state ? { ...state, [slug]: { ...state[slug], ...patch } } : state
    );
  }

  function updateLegalSection(slug: LegalPageKey, index: number, patch: Partial<LegalSection>) {
    mark(slug);
    setPages((state) => {
      if (!state) return state;
      const page = state[slug];
      return {
        ...state,
        [slug]: {
          ...page,
          sections: page.sections.map((section, i) =>
            i === index ? { ...section, ...patch } : section
          ),
        },
      };
    });
  }

  function addLegalSection(slug: LegalPageKey) {
    mark(slug);
    setPages((state) => {
      if (!state) return state;
      const page = state[slug];
      return {
        ...state,
        [slug]: {
          ...page,
          sections: [...page.sections, { heading: "כותרת חדשה", paragraphs: ["טקסט חדש"] }],
        },
      };
    });
  }

  function removeLegalSection(slug: LegalPageKey, index: number) {
    mark(slug);
    setPages((state) => {
      if (!state) return state;
      const page = state[slug];
      return {
        ...state,
        [slug]: { ...page, sections: page.sections.filter((_, i) => i !== index) },
      };
    });
  }

  function updateAbout(patch: Partial<AboutPageContent>) {
    mark("about");
    setPages((state) =>
      state ? { ...state, about: { ...state.about, ...patch } } : state
    );
  }

  function updateAboutValue(index: number, patch: Partial<AboutValue>) {
    mark("about");
    setPages((state) =>
      state
        ? {
            ...state,
            about: {
              ...state.about,
              values: state.about.values.map((value, i) =>
                i === index ? { ...value, ...patch } : value
              ),
            },
          }
        : state
    );
  }

  function addAboutValue() {
    mark("about");
    setPages((state) =>
      state
        ? {
            ...state,
            about: {
              ...state.about,
              values: [
                ...state.about.values,
                { icon: "✨", title: "ערך חדש", text: "תיאור קצר" },
              ],
            },
          }
        : state
    );
  }

  function removeAboutValue(index: number) {
    mark("about");
    setPages((state) =>
      state
        ? {
            ...state,
            about: {
              ...state.about,
              values: state.about.values.filter((_, i) => i !== index),
            },
          }
        : state
    );
  }

  function updateContact(patch: Partial<ContactPageContent>) {
    mark("contact");
    setPages((state) =>
      state ? { ...state, contact: { ...state.contact, ...patch } } : state
    );
  }

  async function save() {
    if (!pages) return;
    const dirty = Array.from(dirtyRef.current);
    const changedKeys = dirty.length ? dirty : changedKeysFrom(baseRef.current, pages);
    if (changedKeys.length === 0) {
      onToast("אין שינויים לשמירה", true);
      return;
    }
    setSaving(true);
    try {
      await apiSend("/api/pages", "PUT", { pages, changedKeys });
      const latest = await apiGet<ContentPages>("/api/pages").catch(() => pages);
      setPages(latest);
      baseRef.current = clone(latest);
      dirtyRef.current.clear();
      onToast("עמודי התוכן נשמרו — האתר יתעדכן בעוד דקה־שתיים", true);
    } catch (e) {
      onToast((e as Error).message, false);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !pages) return <p className="p-8 text-gray-500">טוען…</p>;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-heading">עמודי תוכן</h2>
            <p className="mt-1 text-sm text-muted">
              עריכת עמודי המידע בפוטר. שמירה מתבצעת במיזוג לפי עמוד, כדי לא לדרוס עריכות מקבילות.
            </p>
          </div>
          <Button onClick={save} disabled={saving}>
            {saving ? "שומר…" : "שמירת עמודי תוכן"}
          </Button>
        </div>
      </section>

      {LEGAL_PAGES.map(({ slug, label, hint }) => {
        const page = pages[slug];
        return (
          <details key={slug} className="rounded-2xl border border-line bg-white p-5 shadow-card" open={slug === "privacy"}>
            <summary className="cursor-pointer text-lg font-extrabold text-heading">
              {label}
              <span className="mr-2 text-xs font-normal text-muted">{hint}</span>
            </summary>
            <div className="mt-5 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="כותרת העמוד" value={page.title} onChange={(value) => updateLegal(slug, { title: value })} />
                <Field label="עודכן לאחרונה" value={page.updated} onChange={(value) => updateLegal(slug, { updated: value })} />
              </div>
              <TextArea label="משפט פתיחה" value={page.intro ?? ""} onChange={(value) => updateLegal(slug, { intro: value })} rows={2} />

              <div className="space-y-4">
                {page.sections.map((section, index) => (
                  <div key={index} className="rounded-xl border border-line bg-gray-50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className="font-bold text-heading">מקטע {index + 1}</h3>
                      <Button variant="danger" onClick={() => removeLegalSection(slug, index)}>
                        מחיקה
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <Field label="כותרת מקטע" value={section.heading} onChange={(value) => updateLegalSection(slug, index, { heading: value })} />
                      <TextArea
                        label="פסקאות (כל שורה = פסקה)"
                        value={lines(section.paragraphs)}
                        onChange={(value) => updateLegalSection(slug, index, { paragraphs: optionalLines(value) })}
                        rows={4}
                      />
                      <TextArea
                        label="בולטים (כל שורה = בולט, אפשר להשאיר ריק)"
                        value={lines(section.bullets)}
                        onChange={(value) => updateLegalSection(slug, index, { bullets: optionalLines(value) })}
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="subtle" onClick={() => addLegalSection(slug)}>
                + הוספת מקטע
              </Button>
            </div>
          </details>
        );
      })}

      <details className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <summary className="cursor-pointer text-lg font-extrabold text-heading">
          {PAGE_LABELS.about}
          <span className="mr-2 text-xs font-normal text-muted">טקסט האודות ושלושת ערכי השירות</span>
        </summary>
        <div className="mt-5 space-y-5">
          <Field label="כותרת העמוד" value={pages.about.title} onChange={(value) => updateAbout({ title: value })} />
          <TextArea
            label="פסקאות פתיחה (כל שורה = פסקה; הפסקה הראשונה מוצגת אחרי שם החנות המודגש)"
            value={lines(pages.about.intro)}
            onChange={(value) => updateAbout({ intro: splitLines(value) })}
            rows={5}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="טקסט לפני כתובת"
              value={pages.about.visit.addressLead}
              onChange={(value) => updateAbout({ visit: { ...pages.about.visit, addressLead: value } })}
            />
            <Field
              label="טקסט לפני טלפון"
              value={pages.about.visit.phoneLead}
              onChange={(value) => updateAbout({ visit: { ...pages.about.visit, phoneLead: value } })}
            />
          </div>

          <div className="space-y-4">
            {pages.about.values.map((value, index) => (
              <div key={index} className="rounded-xl border border-line bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="font-bold text-heading">ערך {index + 1}</h3>
                  <Button variant="danger" onClick={() => removeAboutValue(index)}>
                    מחיקה
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-[5rem_1fr]">
                  <Field label="אייקון" value={value.icon} onChange={(next) => updateAboutValue(index, { icon: next })} />
                  <Field label="כותרת" value={value.title} onChange={(next) => updateAboutValue(index, { title: next })} />
                </div>
                <div className="mt-3">
                  <TextArea label="טקסט" value={value.text} onChange={(next) => updateAboutValue(index, { text: next })} rows={2} />
                </div>
              </div>
            ))}
          </div>
          <Button variant="subtle" onClick={addAboutValue}>
            + הוספת ערך
          </Button>
        </div>
      </details>

      <details className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <summary className="cursor-pointer text-lg font-extrabold text-heading">
          {PAGE_LABELS.contact}
          <span className="mr-2 text-xs font-normal text-muted">כותרת ומשפט פתיחה; פרטי טלפון וכתובת נשארים תחת מותג ופרטים</span>
        </summary>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="כותרת העמוד" value={pages.contact.title} onChange={(value) => updateContact({ title: value })} />
          <Field label="משפט פתיחה" value={pages.contact.lead} onChange={(value) => updateContact({ lead: value })} />
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? "שומר…" : "שמירת עמודי תוכן"}</Button>
        <Button
          variant="ghost"
          onClick={() => {
            setRawText(JSON.stringify(pages, null, 2));
            setShowRaw((value) => !value);
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
            rows={18}
            onChange={(event) => setRawText(event.target.value)}
            className="w-full rounded-lg border border-line bg-gray-50 p-3 font-mono text-xs text-gray-900"
          />
          <div className="mt-3 flex gap-2">
            <Button
              variant="subtle"
              onClick={() => {
                try {
                  const parsed = JSON.parse(rawText) as ContentPages;
                  setPages(parsed);
                  changedKeysFrom(baseRef.current, parsed).forEach((key) => mark(key));
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
