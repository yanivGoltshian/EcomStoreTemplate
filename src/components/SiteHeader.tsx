"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "./Logo";
import SearchAutocomplete from "./SearchAutocomplete";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { nav, site, waLink, telLink, wazeLink } from "@/lib/data";

const socials = [
  {
    label: "פייסבוק",
    href: site.facebook,
    path: "M13.5 9H15V6.5h-1.8c-1.9 0-2.7 1.2-2.7 2.8V11H9v2.4h1.5V20h2.6v-6.6h1.9l.3-2.4h-2.2V9.6c0-.4.2-.6.8-.6Z",
  },
  {
    label: "וואטסאפ",
    href: waLink,
    path: "M12 2a9.8 9.8 0 0 0-8.4 14.9L2 22l5.3-1.4A9.8 9.8 0 1 0 12 2Zm0 17.8c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.1.8.8-3-.2-.3A8 8 0 1 1 12 19.8Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3c-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.2.2 1.9 2.9 4.6 4 .6.3 1.1.4 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.2-.2-.2-.4-.3Z",
  },
  {
    label: `ניווט עם Waze · ${site.address.full}`,
    href: wazeLink,
    path: "M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z",
  },
];

export default function SiteHeader() {
  const { count } = useCart();
  const { count: wishCount } = useWishlist();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSub, setOpenSub] = useState<number | null>(null);

  return (
    <header className="sticky top-0 z-50">
      {/* Topbar */}
      <div className="border-b bg-white text-ink">
        <div className="container-x flex h-9 items-center justify-between text-[0.72rem]">
          <div className="flex items-center gap-1.5">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                title={s.label}
                aria-label={s.label}
                className="grid h-6 w-6 place-items-center rounded-full bg-soft text-brand-red transition-colors hover:bg-brand-red hover:text-white"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
          <span className="hidden italic tracking-wide text-muted sm:block">
            איכות ושירות <span className="font-bold not-italic text-brand-red">משנת 1986</span>
          </span>
          <a href={telLink} className="flex items-center gap-1.5 font-bold text-brand-red">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.58 3.6a1 1 0 0 1-.25 1l-2.2 2.2Z" />
            </svg>
            {site.phone}
          </a>
        </div>
      </div>

      {/* Main header */}
      <div className="border-b bg-white shadow-sm">
        <div className="container-x flex h-[68px] items-center gap-3">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded border border-line text-ink lg:hidden"
            aria-label="תפריט"
          >
            <span className="text-xl">{mobileOpen ? "✕" : "☰"}</span>
          </button>

          <Logo onLight />

          <div className="relative mx-auto hidden max-w-xl flex-1 md:block">
            <SearchAutocomplete variant="desktop" />
          </div>

          <Link
            href="/wishlist/"
            aria-label={wishCount > 0 ? `רשימת משאלות, ${wishCount} פריטים` : "רשימת משאלות"}
            className="ms-auto grid h-9 w-9 place-items-center rounded-md text-ink transition-colors hover:text-brand-red md:ms-0"
          >
            <span className="relative grid h-9 w-9 place-items-center">
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20.3 4.7 13a4.6 4.6 0 0 1 6.5-6.5l.8.8.8-.8A4.6 4.6 0 0 1 19.3 13Z" />
              </svg>
              {wishCount > 0 && (
                <span className="absolute -top-0.5 end-0 grid h-4 min-w-4 place-items-center rounded-full bg-brand-red px-1 text-[0.62rem] font-bold leading-none text-white">
                  {wishCount}
                </span>
              )}
            </span>
          </Link>

          <Link
            href="/cart/"
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-bold text-ink hover:text-brand-red"
          >
            <span id="cart-fly-target" className="relative grid h-9 w-9 place-items-center">
              <svg className={count > 0 ? "cart-nudge" : undefined} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="20" r="1.4" />
                <circle cx="17" cy="20" r="1.4" />
                <path d="M3 4h2l2.2 11.2a1 1 0 0 0 1 .8h7.9a1 1 0 0 0 1-.78L19.5 8H6.2" />
              </svg>
              {count > 0 && (
                <span className="cart-badge-pulse absolute -top-0.5 end-0 grid h-4 min-w-4 place-items-center rounded-full bg-brand-red px-1 text-[0.62rem] font-bold leading-none text-white">
                  {count}
                </span>
              )}
            </span>
            <span className="hidden sm:inline">עגלת קניות</span>
          </Link>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="max-h-[80vh] overflow-y-auto border-b bg-white lg:hidden">
          <div className="container-x py-3">
            <SearchAutocomplete variant="mobile" onNavigate={() => setMobileOpen(false)} />
          </div>
          <ul className="container-x pb-4">
            {nav.map((cat) => (
              <li key={cat.id} className="border-b">
                <div className="flex items-center justify-between">
                  <Link
                    href={cat.href ?? `/category/${cat.id}/`}
                    onClick={() => setMobileOpen(false)}
                    className="flex flex-1 items-center gap-2 py-3 text-sm font-semibold text-ink"
                  >
                    <span>{cat.icon}</span>
                    {cat.name}
                  </Link>
                  {cat.subs.length > 0 && (
                    <button
                      onClick={() => setOpenSub((v) => (v === cat.id ? null : cat.id))}
                      className="grid h-8 w-8 place-items-center text-muted"
                      aria-label="תת-קטגוריות"
                    >
                      {openSub === cat.id ? "−" : "+"}
                    </button>
                  )}
                </div>
                {openSub === cat.id && (
                  <ul className="pb-2 ps-6">
                    {cat.subs.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          href={sub.href ?? `/category/${sub.id}/`}
                          onClick={() => setMobileOpen(false)}
                          className="block py-1.5 text-[0.82rem] text-muted"
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
