"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  apiGet,
  getAuthConfig,
  getAuthToken,
  setAuthToken,
} from "./lib";
import { Toast, type ToastState } from "./ui";
import BrandTab from "./BrandTab";
import HomepageTab from "./HomepageTab";
import ProductsTab from "./ProductsTab";
import CategoriesTab from "./CategoriesTab";
import PagesTab from "./PagesTab";
import ImportExport from "./ImportExport";
import { site } from "@/lib/data";

type TabId = "brand" | "homepage" | "products" | "categories" | "pages" | "data";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "homepage", label: "עמוד הבית", icon: "🏠" },
  { id: "products", label: "מוצרים", icon: "📦" },
  { id: "categories", label: "קטגוריות", icon: "🗂️" },
  { id: "pages", label: "עמודי תוכן", icon: "📄" },
  { id: "data", label: "ייבוא/ייצוא", icon: "📊" },
  { id: "brand", label: "מותג ופרטים", icon: "⚙️" },
];

// Compact brand lockup (gold lightning bolt) matching the storefront Logo, but
// NOT a link — so tapping it never navigates the admin away from the panel.
function BrandMark({ subtitle }: { subtitle?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        width={30}
        height={30}
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ filter: "drop-shadow(0 0 2px rgba(212,175,55,.5))", transform: "skewX(-9deg)" }}
      >
        <path
          d="M13.6 2 4 13.7h6L9 22l11-12.6h-6.6L13.6 2Z"
          fill="none"
          stroke="#d4af37"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="text-[0.95rem] font-black italic tracking-tight text-white">
          {site.name}
        </span>
        <span className="mt-0.5 text-[0.58rem] font-bold uppercase tracking-[0.22em] text-brand-gold">
          {subtitle || "ניהול האתר"}
        </span>
      </span>
    </span>
  );
}

type AuthState = "checking" | "authorized" | "denied";

type GoogleId = {
  initialize: (cfg: {
    client_id: string;
    callback: (resp: { credential?: string }) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
  disableAutoSelect: () => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

function isLocalHost(): boolean {
  return (
    typeof window !== "undefined" &&
    /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
  );
}

function decodeEmail(jwt: string): string {
  try {
    let s = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const payload = JSON.parse(atob(s)) as { email?: string; name?: string };
    return payload.email || payload.name || "מנהל";
  } catch {
    return "מנהל";
  }
}

function loadGsiScript(): Promise<GoogleId | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(null);
    if (window.google?.accounts?.id) return resolve(window.google.accounts.id);
    const existing = document.getElementById("gsi-script");
    const onReady = () => resolve(window.google?.accounts?.id ?? null);
    if (existing) {
      existing.addEventListener("load", onReady, { once: true });
      return;
    }
    const s = document.createElement("script");
    s.id = "gsi-script";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = onReady;
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
}

export default function AdminApp() {
  const [auth, setAuth] = useState<AuthState>("checking");
  const [user, setUser] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [tab, setTab] = useState<TabId>("homepage");
  const [toast, setToast] = useState<ToastState>(null);
  const btnRef = useRef<HTMLDivElement | null>(null);
  const renderedRef = useRef(false);

  const onToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Validate a Google token against the API (server enforces the allowlist).
  const enter = useCallback(async (token: string, email: string): Promise<boolean> => {
    setAuthToken(token);
    try {
      await apiGet("/api/categories");
      setUser(email);
      setLoginError("");
      setAuth("authorized");
      return true;
    } catch {
      setAuthToken(null);
      return false;
    }
  }, []);

  // Initial auth decision: local dev bypass, or resume a stored token.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isLocalHost()) {
        setUser("מצב פיתוח מקומי");
        setAuth("authorized");
        return;
      }
      const cfg = await getAuthConfig();
      if (cancelled) return;
      setClientId(cfg.googleClientId);

      const stored = getAuthToken();
      if (stored) {
        const ok = await enter(stored, decodeEmail(stored));
        if (cancelled) return;
        if (ok) return;
      }
      setAuth("denied");
    })();
    return () => {
      cancelled = true;
    };
  }, [enter]);

  // Render the "Sign in with Google" button on the denied screen.
  useEffect(() => {
    if (auth !== "denied" || !clientId || renderedRef.current) return;
    let cancelled = false;
    (async () => {
      const gid = await loadGsiScript();
      if (cancelled || !gid || !btnRef.current) return;
      gid.initialize({
        client_id: clientId,
        cancel_on_tap_outside: true,
        callback: async (resp) => {
          if (!resp.credential) return;
          const ok = await enter(resp.credential, decodeEmail(resp.credential));
          if (!ok) {
            setLoginError("לחשבון הזה אין הרשאת מנהל. פנה למנהל האתר.");
          }
        },
      });
      gid.renderButton(btnRef.current, {
        type: "standard",
        theme: "filled_blue",
        size: "large",
        text: "signin_with",
        shape: "pill",
        locale: "he",
        width: 280,
      });
      renderedRef.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, [auth, clientId, enter]);

  const logout = useCallback(() => {
    try {
      window.google?.accounts?.id?.disableAutoSelect();
    } catch {
      /* ignore */
    }
    setAuthToken(null);
    renderedRef.current = false;
    setUser("");
    setAuth("denied");
  }, []);

  if (auth === "checking") {
    return (
      <div className="grid min-h-screen place-items-center bg-soft text-muted" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <span className="h-9 w-9 animate-spin rounded-full border-2 border-line border-t-brand-red" />
          <span className="text-sm font-semibold">בודק הרשאות…</span>
        </div>
      </div>
    );
  }

  if (auth === "denied") {
    return (
      <div className="grid min-h-screen place-items-center bg-soft p-6" dir="rtl">
        <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white text-center shadow-pop">
          <div className="stars-bg px-6 py-7">
            <BrandMark />
          </div>
          <div className="p-6">
            <h1 className="mb-2 text-lg font-extrabold text-heading">כניסת מנהלים</h1>
            <p className="mb-6 text-sm text-muted">
              התחברו עם חשבון Google המורשה כדי לנהל את האתר.
            </p>
            {clientId ? (
              <div className="flex justify-center">
                <div ref={btnRef} />
              </div>
            ) : (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                ההתחברות עדיין לא הוגדרה. יש להגדיר את מזהה Google (Client ID).
              </p>
            )}
            {loginError ? (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-brand-red">
                {loginError}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft" dir="rtl">
      <header className="sticky top-0 z-40 shadow-md">
        <div className="stars-bg">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
            <BrandMark subtitle={user} />
            <div className="flex items-center gap-1.5">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/30 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/10"
              >
                צפייה באתר ↗
              </a>
              <button
                onClick={logout}
                className="rounded-full border border-white/30 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/10"
              >
                יציאה
              </button>
            </div>
          </div>
        </div>
        <nav className="border-b border-line bg-white">
          <div className="mx-auto flex max-w-5xl gap-1.5 overflow-x-auto px-3 py-2 no-scrollbar sm:px-4">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
                  tab === t.id
                    ? "bg-brand-red text-white shadow-sm"
                    : "bg-soft text-heading hover:bg-line"
                }`}
              >
                <span aria-hidden="true">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-3 py-5 sm:px-4 sm:py-6">
        {tab === "brand" ? <BrandTab onToast={onToast} /> : null}
        {tab === "homepage" ? <HomepageTab onToast={onToast} /> : null}
        {tab === "products" ? <ProductsTab onToast={onToast} /> : null}
        {tab === "categories" ? <CategoriesTab onToast={onToast} /> : null}
        {tab === "pages" ? <PagesTab onToast={onToast} /> : null}
        {tab === "data" ? <ImportExport onToast={onToast} /> : null}
      </main>

      <Toast toast={toast} />
    </div>
  );
}
