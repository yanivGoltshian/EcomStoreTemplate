"use client";

import { useEffect, useRef, useState } from "react";
import type { Site } from "@/lib/types";
import { apiGet, apiSend, uploadLogo, uploadFavicon } from "./lib";
import { Field, TextArea, Button } from "./ui";

export default function BrandTab({
  onToast,
}: {
  onToast: (msg: string, ok: boolean) => void;
}) {
  const [site, setSite] = useState<Site | null>(null);
  const [saving, setSaving] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [rawText, setRawText] = useState("");

  useEffect(() => {
    apiGet<Site>("/api/site")
      .then(setSite)
      .catch((e: Error) => onToast(e.message, false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!site) return <p className="p-8 text-gray-500">טוען…</p>;

  function set<K extends keyof Site>(k: K, v: Site[K]) {
    setSite((s) => (s ? { ...s, [k]: v } : s));
  }
  function setAddr<K extends keyof Site["address"]>(
    k: K,
    v: Site["address"][K]
  ) {
    setSite((s) => (s ? { ...s, address: { ...s.address, [k]: v } } : s));
  }

  const DEFAULT_PRIMARY = "#2563eb";
  const DEFAULT_LOGO = "/images/brand/logo.png";
  const themePrimary = site.theme?.primary || DEFAULT_PRIMARY;
  const logoImage = site.logo?.image || DEFAULT_LOGO;
  const logoAlt = site.logo?.alt ?? site.name;
  const siteFavicon = site.favicon || "";

  function setThemePrimary(v: string) {
    setSite((s) =>
      s ? { ...s, theme: { ...(s.theme ?? { primary: DEFAULT_PRIMARY }), primary: v } } : s
    );
  }
  function setLogoField<K extends keyof NonNullable<Site["logo"]>>(
    k: K,
    v: NonNullable<Site["logo"]>[K]
  ) {
    setSite((s) =>
      s
        ? {
            ...s,
            logo: { ...(s.logo ?? { image: DEFAULT_LOGO, alt: s.name }), [k]: v },
          }
        : s
    );
  }

  async function save(payload: Site) {
    setSaving(true);
    try {
      await apiSend("/api/site", "PUT", payload);
      onToast("הגדרות המותג נשמרו — האתר יתעדכן בעוד דקה־שתיים", true);
    } catch (e) {
      onToast((e as Error).message, false);
    } finally {
      setSaving(false);
    }
  }

  function openRaw() {
    setRawText(JSON.stringify(site, null, 2));
    setShowRaw(true);
  }

  function applyRaw() {
    try {
      const parsed = JSON.parse(rawText) as Site;
      setSite(parsed);
      setShowRaw(false);
      onToast("עודכן מ־JSON. לחצו שמירה כדי לפרסם.", true);
    } catch {
      onToast("JSON לא תקין", false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="mb-4 text-lg font-extrabold text-heading">שם ומיתוג</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="שם החנות" value={site.name} onChange={(v) => set("name", v)} />
          <Field label="שם באנגלית" value={site.nameEn} onChange={(v) => set("nameEn", v)} dir="ltr" />
          <Field label="שם משפטי / חברה" value={site.legalName} onChange={(v) => set("legalName", v)} />
          <Field label="סלוגן / תיאור קצר" value={site.tagline} onChange={(v) => set("tagline", v)} />
          <Field
            label="כתובת האתר (Domain)"
            value={site.url}
            onChange={(v) => set("url", v)}
            dir="ltr"
            hint="חשוב ל־SEO. עדכנו לכתובת האמיתית אחרי הפריסה."
          />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="mb-1 text-lg font-extrabold text-heading">מיתוג חזותי</h2>
        <p className="mb-4 text-xs text-gray-400">
          צבע הנושא, הלוגו והטקסט החלופי שלו — משפיעים על כל האתר.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <span className="mb-1 block text-sm font-semibold text-gray-700">
              צבע ראשי של האתר
            </span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(themePrimary) ? themePrimary : DEFAULT_PRIMARY}
                onChange={(e) => setThemePrimary(e.target.value)}
                className="h-10 w-14 shrink-0 cursor-pointer rounded-md border border-line bg-white p-1"
                aria-label="בורר צבע ראשי"
              />
              <input
                type="text"
                dir="ltr"
                value={themePrimary}
                onChange={(e) => setThemePrimary(e.target.value)}
                className="w-32 rounded-lg border border-line px-3 py-2 font-mono text-sm text-gray-900"
                aria-label="קוד צבע (Hex)"
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              משפיע על הכותרת, הכפתורים והקישורים בכל האתר (לדוגמה {DEFAULT_PRIMARY}).
            </p>
          </div>

          <Field
            label="טקסט חלופי ללוגו (Alt)"
            value={logoAlt}
            onChange={(v) => setLogoField("alt", v)}
            hint="טקסט נגישות שמתאר את הלוגו (משמש גם לקישור לדף הבית)"
          />
        </div>

        <div className="mt-5">
          <LogoPicker
            value={logoImage}
            onUploaded={(p) => setLogoField("image", p)}
            onError={(m) => onToast(m, false)}
          />
        </div>

        <div className="mt-5 border-t border-line pt-5">
          <FaviconPicker
            value={siteFavicon}
            onUploaded={(p) => set("favicon", p)}
            onClear={() => set("favicon", undefined)}
            onError={(m) => onToast(m, false)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="mb-4 text-lg font-extrabold text-heading">פרטי קשר ורשתות</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="טלפון (תצוגה)" value={site.phone} onChange={(v) => set("phone", v)} dir="ltr" />
          <Field label="טלפון (ספרות בלבד)" value={site.phoneRaw} onChange={(v) => set("phoneRaw", v)} dir="ltr" hint="לקישור חיוג, לדוגמה 0312345678" />
          <Field label="וואטסאפ (בינלאומי)" value={site.whatsapp} onChange={(v) => set("whatsapp", v)} dir="ltr" hint="לדוגמה 972500000000" />
          <Field label="וואטסאפ (תצוגה)" value={site.whatsappDisplay} onChange={(v) => set("whatsappDisplay", v)} dir="ltr" />
          <Field label="אימייל" value={site.email} onChange={(v) => set("email", v)} dir="ltr" />
          <Field label="פייסבוק (URL)" value={site.facebook} onChange={(v) => set("facebook", v)} dir="ltr" />
          <Field
            label="קישור לביקורות Google"
            value={site.googleReviewUrl ?? ""}
            onChange={(v) => set("googleReviewUrl", v.trim() ? v.trim() : undefined)}
            dir="ltr"
            hint="הקישור לכתיבת ביקורת בגוגל. כשמלא — מופיע כפתור 'דרגו אותנו ב‑Google' בדף הבית ובפוטר. השאירו ריק כדי להסתיר אותו."
          />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="mb-4 text-lg font-extrabold text-heading">כתובת הסניף</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="רחוב" value={site.address.street} onChange={(v) => setAddr("street", v)} />
          <Field label="רחוב (אנגלית)" value={site.address.streetEn} onChange={(v) => setAddr("streetEn", v)} dir="ltr" />
          <Field label="עיר" value={site.address.city} onChange={(v) => setAddr("city", v)} />
          <Field label="עיר (אנגלית)" value={site.address.cityEn} onChange={(v) => setAddr("cityEn", v)} dir="ltr" />
          <Field label="מיקוד" value={site.address.postalCode} onChange={(v) => setAddr("postalCode", v)} dir="ltr" />
          <Field label="מדינה" value={site.address.country} onChange={(v) => setAddr("country", v)} dir="ltr" />
        </div>
        <div className="mt-4">
          <Field label="כתובת מלאה (תצוגה)" value={site.address.full} onChange={(v) => setAddr("full", v)} />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="mb-4 text-lg font-extrabold text-heading">שעות פעילות</h2>
        <TextArea label="שעות (טקסט חופשי)" value={site.hours} onChange={(v) => set("hours", v)} rows={2} />
        <p className="mt-2 text-xs text-gray-400">
          שעות מובְנות ל־SEO ניתן לערוך דרך עורך ה־JSON המתקדם למטה.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => save(site)} disabled={saving}>
          {saving ? "שומר…" : "שמירת הגדרות המותג"}
        </Button>
        <Button variant="ghost" onClick={openRaw}>
          עריכה מתקדמת (JSON)
        </Button>
      </div>

      {showRaw ? (
        <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
          <h3 className="mb-2 text-sm font-extrabold text-heading">עורך JSON מתקדם</h3>
          <textarea
            value={rawText}
            dir="ltr"
            rows={16}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full rounded-lg border border-line bg-gray-50 p-3 font-mono text-xs text-gray-900"
          />
          <div className="mt-3 flex gap-2">
            <Button variant="subtle" onClick={applyRaw}>
              החלה
            </Button>
            <Button variant="ghost" onClick={() => setShowRaw(false)}>
              ביטול
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LogoPicker({
  value,
  onUploaded,
  onError,
}: {
  value: string;
  onUploaded: (path: string) => void;
  onError: (msg: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
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
      const path = await uploadLogo(file);
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

  const previewSrc = localPreview || value;

  useEffect(() => {
    setImgError(false);
  }, [previewSrc]);

  return (
    <div>
      <span className="mb-1 block text-sm font-semibold text-gray-700">לוגו האתר</span>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-32 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-gray-100 p-1">
          {previewSrc && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt=""
              className="h-full w-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : value ? (
            <span className="px-1 text-center text-[10px] leading-tight text-gray-400">
              🕓 מתפרסם…
            </span>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/svg+xml,image/webp,image/jpeg"
          hidden
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <Button variant="ghost" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? "מעלה…" : "העלאת לוגו"}
        </Button>
      </div>
      {justUploaded ? (
        <p className="mt-1 text-xs text-emerald-700">
          ✓ הלוגו נשמר. שמרו ופרסמו — הוא יופיע באתר תוך 2–3 דקות (זמן פרסום).
        </p>
      ) : null}
      <p className="mt-1 text-xs text-gray-400" dir="ltr">
        {value}
      </p>
    </div>
  );
}

function FaviconPicker({
  value,
  onUploaded,
  onClear,
  onError,
}: {
  value: string;
  onUploaded: (path: string) => void;
  onClear: () => void;
  onError: (msg: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
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
      const path = await uploadFavicon(file);
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

  function clear() {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    setJustUploaded(false);
    setImgError(false);
    onClear();
  }

  // Fall back to the bundled branded icon when no custom favicon is set.
  const fallback = "/icon.svg";
  const previewSrc = localPreview || value || fallback;

  useEffect(() => {
    setImgError(false);
  }, [previewSrc]);

  return (
    <div>
      <span className="mb-1 block text-sm font-semibold text-gray-700">
        אייקון האתר (Favicon)
      </span>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-gray-100 p-1">
          {previewSrc && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt=""
              className="h-full w-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : value ? (
            <span className="px-1 text-center text-[10px] leading-tight text-gray-400">
              🕓 מתפרסם…
            </span>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/svg+xml,image/webp,image/jpeg"
          hidden
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <Button variant="ghost" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? "מעלה…" : "העלאת אייקון"}
        </Button>
        {value ? (
          <Button variant="ghost" onClick={clear} disabled={busy}>
            איפוס לברירת מחדל
          </Button>
        ) : null}
      </div>
      {justUploaded ? (
        <p className="mt-1 text-xs text-emerald-700">
          ✓ האייקון נשמר. שמרו ופרסמו — הוא יופיע בלשונית הדפדפן תוך 2–3 דקות (זמן פרסום).
        </p>
      ) : null}
      <p className="mt-1 text-xs text-gray-400">
        האייקון שמופיע בלשונית הדפדפן ובמסך הבית. מומלץ תמונה ריבועית (PNG עם שקיפות).
        {value ? null : " כרגע בשימוש האייקון המותגי המובנה."}
      </p>
      {value ? (
        <p className="mt-1 text-xs text-gray-400" dir="ltr">
          {value}
        </p>
      ) : null}
    </div>
  );
}
