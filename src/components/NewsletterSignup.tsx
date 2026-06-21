"use client";

import { useState } from "react";
import Link from "next/link";
import { newsletterEnabled, NEWSLETTER_ENDPOINT } from "@/lib/newsletter";

// Newsletter signup band shown in the footer site-wide. Renders nothing when the
// feature is OFF (build-time gate). On submit it POSTs the email to the admin
// Function (NEWSLETTER_ENDPOINT), which forwards it to Brevo. Israeli marketing
// law: an explicit consent checkbox + a link to the privacy policy are required.
type Status = "idle" | "loading" | "ok" | "error";

export default function NewsletterSignup() {
  if (!newsletterEnabled) return null;
  return <NewsletterForm />;
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState("");

  const busy = status === "loading";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const value = email.trim();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setStatus("error");
      setMsg("נא להזין כתובת אימייל תקינה.");
      return;
    }
    if (!consent) {
      setStatus("error");
      setMsg("יש לאשר קבלת דיוור כדי להירשם.");
      return;
    }
    setStatus("loading");
    setMsg("");
    try {
      const res = await fetch(NEWSLETTER_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: value, company }),
      });
      if (res.ok) {
        setStatus("ok");
        setMsg("נרשמתם בהצלחה! תודה 🎉");
        setEmail("");
        setConsent(false);
        return;
      }
      let err = "ההרשמה נכשלה. נסו שוב מאוחר יותר.";
      try {
        const j = (await res.json()) as { error?: string };
        if (j && j.error) err = j.error;
      } catch {
        /* non-JSON error */
      }
      setStatus("error");
      setMsg(err);
    } catch {
      setStatus("error");
      setMsg("שגיאת רשת. נסו שוב מאוחר יותר.");
    }
  }

  return (
    <div className="border-t border-white/15">
      <div className="container-x py-10">
        <div className="mx-auto max-w-2xl text-center">
          <h3 className="text-lg font-black text-white sm:text-xl">
            ✉️ הצטרפו לרשימת התפוצה שלנו
          </h3>
          <p className="mt-2 text-[0.85rem] text-white/80">
            מבצעים, חידושים והטבות — ישירות למייל. אפשר לבטל את ההרשמה בכל עת.
          </p>

          {status === "ok" ? (
            <p
              className="mt-5 rounded-lg bg-white/15 px-4 py-3 text-sm font-bold text-white"
              role="status"
            >
              {msg}
            </p>
          ) : (
            <form onSubmit={submit} className="mt-5" noValidate>
              {/* Honeypot — hidden from real users, catches bots */}
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="hidden"
                aria-hidden="true"
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  inputMode="email"
                  dir="ltr"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  aria-label="כתובת אימייל"
                  className="min-h-[2.9rem] flex-1 rounded-lg border border-white/25 bg-white/95 px-4 py-2.5 text-base text-gray-900 outline-none placeholder:text-gray-400 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/40"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="min-h-[2.9rem] rounded-lg bg-brand-gold px-6 py-2.5 text-sm font-black text-ink shadow-sm transition hover:brightness-110 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? "רושם…" : "הרשמה"}
                </button>
              </div>

              <label className="mt-3 flex items-start justify-center gap-2 text-right text-[0.78rem] text-white/80">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-brand-gold"
                />
                <span>
                  אני מאשר/ת קבלת דיוור פרסומי ועדכונים, בכפוף ל
                  <Link
                    href="/privacy/"
                    className="font-semibold text-brand-gold underline hover:text-white"
                  >
                    מדיניות הפרטיות
                  </Link>
                  .
                </span>
              </label>

              {status === "error" && msg ? (
                <p className="mt-2 text-[0.8rem] font-semibold text-brand-gold" role="alert">
                  {msg}
                </p>
              ) : null}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
