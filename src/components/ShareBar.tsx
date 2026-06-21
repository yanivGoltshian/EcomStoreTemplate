"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ShareBarProps = {
  /** Absolute URL of the page being shared. */
  shareUrl: string;
  /** Pre-filled engaging caption (Hebrew) used for WhatsApp + Copy + Instagram. Should include the URL. */
  message: string;
  /** Store Instagram profile URL — opened as desktop fallback for the Instagram button. */
  instagramUrl: string;
  /** Optional small label shown before the icons (e.g. "שתפו את המוצר"). */
  label?: string;
  /** Native share-sheet title (mobile). */
  shareTitle?: string;
  /** Center the row (used in the homepage band). */
  center?: boolean;
};

const WhatsAppIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.157 5.335 5.493 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.82 9.82 0 001.599 5.317l-.998 3.648 3.897-.764zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

const FacebookIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const LinkIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const ShareGlyph = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
    <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
  </svg>
);

export default function ShareBar({
  shareUrl,
  message,
  instagramUrl,
  label,
  shareTitle,
  center = false,
}: ShareBarProps) {
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const copyText = useCallback(async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      /* fall through to legacy path */
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }, []);

  const openPopup = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer,width=640,height=640");
  }, []);

  const onWhatsApp = useCallback(() => {
    openPopup(`https://wa.me/?text=${encodeURIComponent(message)}`);
  }, [message, openPopup]);

  const onFacebook = useCallback(() => {
    openPopup(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
  }, [shareUrl, openPopup]);

  const onInstagram = useCallback(async () => {
    const nav = navigator as Navigator & {
      share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
    };
    if (typeof nav.share === "function") {
      try {
        await nav.share({ title: shareTitle, text: message, url: shareUrl });
        return;
      } catch {
        /* user cancelled or unsupported — fall through to desktop path */
      }
    }
    const copied = await copyText(message);
    showToast(copied ? "העתקנו את הטקסט — הדביקו בסטורי באינסטגרם 📋" : "פתחו אינסטגרם והדביקו את הקישור");
    window.open(instagramUrl, "_blank", "noopener,noreferrer");
  }, [shareTitle, message, shareUrl, instagramUrl, copyText, showToast]);

  const onCopy = useCallback(async () => {
    const ok = await copyText(shareUrl);
    showToast(ok ? "הקישור הועתק! ✓" : "לא הצלחנו להעתיק — נסו שוב");
  }, [shareUrl, copyText, showToast]);

  return (
    <div className={center ? "flex flex-col items-center" : ""}>
      <div
        className={`flex flex-wrap items-center gap-3.5 ${center ? "justify-center" : ""}`}
      >
        {label && (
          <span className="flex items-center gap-2 text-[0.84rem] font-semibold text-heading">
            <span className="text-muted">{ShareGlyph}</span>
            {label}
          </span>
        )}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onWhatsApp}
            aria-label="שיתוף בוואטסאפ"
            title="וואטסאפ"
            className="share-ico share-ico--wa"
          >
            {WhatsAppIcon}
          </button>
          <button
            type="button"
            onClick={onFacebook}
            aria-label="שיתוף בפייסבוק"
            title="פייסבוק"
            className="share-ico share-ico--fb"
          >
            {FacebookIcon}
          </button>
          <button
            type="button"
            onClick={onInstagram}
            aria-label="שיתוף באינסטגרם"
            title="אינסטגרם"
            className="share-ico share-ico--ig"
          >
            {InstagramIcon}
          </button>
          <button
            type="button"
            onClick={onCopy}
            aria-label="העתקת קישור"
            title="העתקת קישור"
            className="share-ico share-ico--cp"
          >
            {LinkIcon}
          </button>
        </div>
      </div>

      {toast && (
        <div className="share-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}
