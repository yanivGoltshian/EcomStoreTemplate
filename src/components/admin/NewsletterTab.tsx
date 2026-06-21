"use client";

import { useEffect, useState } from "react";
import { apiGet, apiSend } from "./lib";
import { Field, Button, SectionCard, Toggle } from "./ui";

type Settings = {
  enabled: boolean;
  brevoListId: number | null;
  brevoConfigured?: boolean;
};

export default function NewsletterTab({
  onToast,
}: {
  onToast: (msg: string, ok: boolean) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [brevoConfigured, setBrevoConfigured] = useState(false);
  const [listId, setListId] = useState("");
  const [toggling, setToggling] = useState(false);
  const [savingList, setSavingList] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const s = await apiGet<Settings>("/api/newsletter-settings").catch(() => ({
        enabled: false,
        brevoListId: null,
        brevoConfigured: false,
      }));
      setEnabled(s?.enabled === true);
      setBrevoConfigured(!!s?.brevoConfigured);
      setListId(s?.brevoListId ? String(s.brevoListId) : "");
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

  async function toggleSystem(next: boolean) {
    setToggling(true);
    const prev = enabled;
    setEnabled(next);
    try {
      const saved = await apiSend<Settings>(
        "/api/newsletter-settings",
        "PUT",
        { enabled: next, brevoListId: Number(listId) || null },
      );
      setEnabled(saved?.enabled === true);
      setBrevoConfigured(!!saved?.brevoConfigured);
      onToast(
        next
          ? "הניוזלטר הופעל — טופס ההרשמה יופיע באתר בעוד דקה־שתיים"
          : "הניוזלטר כובה — טופס ההרשמה לא יוצג באתר. האתר יתעדכן בעוד דקה־שתיים",
        true,
      );
    } catch (e) {
      setEnabled(prev);
      onToast((e as Error).message, false);
    } finally {
      setToggling(false);
    }
  }

  async function saveList() {
    setSavingList(true);
    try {
      const saved = await apiSend<Settings>(
        "/api/newsletter-settings",
        "PUT",
        { enabled, brevoListId: Number(listId) || null },
      );
      setListId(saved?.brevoListId ? String(saved.brevoListId) : "");
      setBrevoConfigured(!!saved?.brevoConfigured);
      onToast("מזהה הרשימה נשמר", true);
    } catch (e) {
      onToast((e as Error).message, false);
    } finally {
      setSavingList(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">טוען…</p>;
  }

  return (
    <div className="space-y-6">
      {/* Master on/off switch for the whole newsletter feature */}
      <SectionCard title="ניוזלטר (רשימת תפוצה)">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-heading">
              {enabled ? "ההרשמה לניוזלטר פעילה" : "ההרשמה לניוזלטר כבויה"}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {enabled
                ? "טופס ההרשמה מוצג בתחתית כל עמודי האתר. הנרשמים נשמרים ברשימה ב-Brevo."
                : "כשהמערכת כבויה לא מוצג שום טופס הרשמה באתר, ושום הרשמה אינה מתקבלת."}
            </p>
          </div>
          <Toggle
            label={toggling ? "מעדכן…" : enabled ? "פעיל" : "כבוי"}
            checked={enabled}
            onChange={(v) => {
              if (!toggling) toggleSystem(v);
            }}
          />
        </div>
        {!enabled && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            ⚠️ ההרשמה לניוזלטר כבויה. ניתן להגדיר כאן את חיבור Brevo, אך טופס ההרשמה
            לא יוצג ללקוחות עד שתפעילו את המערכת.
          </p>
        )}
      </SectionCard>

      <div className={enabled ? "space-y-6" : "space-y-6 opacity-60"}>
        <SectionCard title="חיבור ל-Brevo">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-heading">מפתח API:</span>
              {brevoConfigured ? (
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                  ✓ מוגדר
                </span>
              ) : (
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                  ✗ לא מוגדר
                </span>
              )}
            </div>
            {!brevoConfigured && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                מפתח ה-API של Brevo מוגדר כמשתנה סביבה מאובטח בשרת
                (BREVO_API_KEY) ואינו נשמר כאן. ללא מפתח תקין ההרשמות לא יישמרו.
              </p>
            )}

            <div className="flex flex-wrap items-end gap-3">
              <div className="grow">
                <Field
                  label="מזהה רשימת התפוצה ב-Brevo (List ID)"
                  type="number"
                  dir="ltr"
                  value={listId}
                  onChange={setListId}
                  placeholder="לדוגמה: 3"
                  hint="המספר מופיע ב-Brevo תחת Contacts → Lists ליד שם הרשימה."
                />
              </div>
              <Button onClick={saveList} disabled={savingList}>
                {savingList ? "שומר…" : "שמירת מזהה רשימה"}
              </Button>
            </div>

            <a
              href="https://app.brevo.com/contact/list-listing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline"
            >
              פתיחת לוח הבקרה של Brevo ↗
            </a>
          </div>
        </SectionCard>

        <SectionCard title="איך זה עובד">
          <ol className="list-decimal space-y-2 pr-5 text-sm leading-relaxed text-gray-700">
            <li>פתחו חשבון חינמי ב-Brevo (עד 300 מיילים ביום, ללא הגבלת אנשי קשר).</li>
            <li>
              ב-Brevo צרו רשימת תפוצה (Contacts → Lists) והעתיקו את מספר הרשימה
              (List ID) לשדה למעלה.
            </li>
            <li>
              צרו מפתח API (SMTP &amp; API → API Keys). יש להגדיר אותו בשרת כמשתנה
              סביבה בשם <code className="font-mono text-xs">BREVO_API_KEY</code>{" "}
              (לא נשמר כאן מטעמי אבטחה).
            </li>
            <li>הפעילו את המתג למעלה — טופס ההרשמה יופיע בתחתית האתר.</li>
          </ol>
        </SectionCard>
      </div>
    </div>
  );
}
