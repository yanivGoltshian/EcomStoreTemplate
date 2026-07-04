import type { ReactNode } from "react";

// Shared mono-line (red outline) icon set — matches the homepage CategoryStrip
// brand style (viewBox 0 0 24 24, stroke currentColor, 1.5 width). Used by the
// product finder so it looks like part of the site instead of grayscale emojis.
export const LINE_ICONS: Record<string, ReactNode> = {
  // ---- interests / categories (identical to CategoryStrip) ----
  kitchen: (
    <>
      <path d="M7 14.5h10V19a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-4.5Z" />
      <path d="M7 14.5a3.8 3.8 0 0 1-.7-7.5 3.5 3.5 0 0 1 6.7-1.2 3.5 3.5 0 0 1 4 4.2A3.8 3.8 0 0 1 17 14.5" />
      <path d="M9.5 16.8v1.6M12 16.8v1.6M14.5 16.8v1.6" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.3" />
      <path d="M12 1.8v2.6M12 19.6v2.6M1.8 12h2.6M19.6 12h2.6M4.6 4.6 6.4 6.4M17.6 17.6l1.8 1.8M19.4 4.6 17.6 6.4M6.4 17.6 4.6 19.4" />
    </>
  ),
  cooling: (
    <>
      <path d="M12 2v20M3.34 7l17.32 10M20.66 7 3.34 17" />
      <path d="M12 5.6 9.9 4M12 5.6 14.1 4M12 18.4 9.9 20M12 18.4 14.1 20" />
      <path d="M5.1 8.6 3 9M19 15l-2.1.4M19 9l-2.1-.4M5.1 15.4 3 15" />
    </>
  ),
  heating: (
    <>
      <path d="M12 3s5 3.5 5 8a5 5 0 0 1-10 0c0-2 1-3.4 2.2-4.6C10.6 5.9 11.6 4.6 12 3Z" />
      <path d="M12 20a2.3 2.3 0 0 0 2.3-2.3c0-1.4-1.1-2.1-2.3-3.4-1.2 1.3-2.3 2-2.3 3.4A2.3 2.3 0 0 0 12 20Z" />
    </>
  ),
  care: (
    <>
      <circle cx="6" cy="7" r="2.4" />
      <circle cx="6" cy="17" r="2.4" />
      <path d="M8 8.6 20 16M8 15.4 20 8" />
    </>
  ),
  clean: (
    <>
      <path d="M9 8.5h5a2 2 0 0 1 2 2V19a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-8.5a2 2 0 0 1 2-2Z" />
      <path d="M9 8.5V5.5h3v3" />
      <path d="M12 5.5V4.5h2.4" />
      <path d="M15.8 4.6h2.4M15.8 6.4h2.4M16.4 8.2h1.8" />
    </>
  ),
  electric: (
    <>
      <path d="M9 3v5M15 3v5" />
      <path d="M7 8h10v2a5 5 0 0 1-10 0V8Z" />
      <path d="M12 15v6" />
    </>
  ),
  white: (
    <>
      <rect x="5.5" y="3" width="13" height="18" rx="2" />
      <circle cx="12" cy="13" r="4.3" />
      <circle cx="12" cy="13" r="1.6" />
      <path d="M8.5 6.4h.01M11 6.4h.01" />
    </>
  ),
  grill: (
    <>
      <path d="M4 7.5h16a8 8 0 0 1-16 0Z" />
      <path d="M8 13.5l-2 6.5M16 13.5l2 6.5M12 14v6" />
      <path d="M9 3c.6 1 .6 1.7 0 2.7M13 3c.6 1 .6 1.7 0 2.7" />
    </>
  ),
  gift: (
    <>
      <rect x="4.5" y="10" width="15" height="9.5" rx="1" />
      <path d="M4.5 13.4h15M12 10v9.5" />
      <path d="M12 10c-1.4 0-3.6.2-3.6-1.9 0-1.3 1.5-1.8 2.4-1.1C11.7 7.7 12 10 12 10ZM12 10c1.4 0 3.6.2 3.6-1.9 0-1.3-1.5-1.8-2.4-1.1C12.3 7.7 12 10 12 10Z" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.8.9.9 1.5l.1.7h5.2l.1-.7c.1-.6.4-1.1.9-1.5A6 6 0 0 0 12 3Z" />
    </>
  ),
  // ---- rooms ----
  bath: (
    <>
      <path d="M4 13h16v2.5a3.5 3.5 0 0 1-3.5 3.5h-9A3.5 3.5 0 0 1 4 15.5V13Z" />
      <path d="M4 13V7a2 2 0 0 1 2-2c1 0 1.7.5 2 1.3" />
      <path d="M7 6.5h2.5" />
      <path d="M7.5 19l-1 2M16.5 19l1 2" />
    </>
  ),
  sofa: (
    <>
      <path d="M6 11V8.5A2.5 2.5 0 0 1 8.5 6h7A2.5 2.5 0 0 1 18 8.5V11" />
      <path d="M4.5 11A2 2 0 0 1 6.5 13v2.5h11V13a2 2 0 0 1 2-2 2 2 0 0 1 2 2v4.5a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V13a2 2 0 0 1 2-2Z" />
      <path d="M7 18.5V20M17 18.5V20" />
    </>
  ),
  // ---- budget ----
  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.6v8.8" />
      <path d="M14.4 9.8a2.4 2.4 0 0 0-4.6.8c0 1.5 4.6 1.3 4.6 3a2.4 2.4 0 0 1-4.6.9" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17" />
      <rect x="3.5" y="7" width="17" height="12" rx="2.5" />
      <path d="M16.5 12.5h4v3h-4a1.5 1.5 0 0 1 0-3Z" />
    </>
  ),
  gem: (
    <>
      <path d="M6.5 4h11l3.2 4.8L12 20 1.3 8.8 6.5 4Z" />
      <path d="M1.6 8.8h20.8M8.5 4 6.5 8.8 12 20M15.5 4l2 4.8L12 20" />
    </>
  ),
  gauge: (
    <>
      <path d="M4.5 19a7.5 7.5 0 1 1 15 0" />
      <path d="M12 12.5 15.5 9" />
      <circle cx="12" cy="19" r="1" />
    </>
  ),
  // ---- preference / sort ----
  tag: (
    <>
      <path d="M19.5 12.5 12 20l-7.5-7.5A2 2 0 0 1 3.9 11V5.4A1.5 1.5 0 0 1 5.4 3.9H11a2 2 0 0 1 1.4.6l7.1 7.1a1.7 1.7 0 0 1 0 2.3Z" />
      <circle cx="8" cy="8" r="1.3" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5 13.7 9 19 10.7 13.7 12.4 12 18l-1.7-5.6L5 10.7 10.3 9 12 3.5Z" />
      <path d="M18.5 15.5l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6.6-1.9Z" />
    </>
  ),
  star: (
    <>
      <path d="m12 3.6 2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.9 6.9 19.3l1-5.7-4.1-4 5.7-.8L12 3.6Z" />
    </>
  ),
  upgrade: (
    <>
      <path d="M12 20V7" />
      <path d="m6.5 12.5 5.5-5.5 5.5 5.5" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14-4.5L4 8" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14 4.5L20 16" />
      <path d="M20 20v-4h-4" />
    </>
  ),
  // ---- misc / ui ----
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.2 2.4 2.4 4.6-5" />
    </>
  ),
};

export function LineIcon({
  name,
  className = "h-9 w-9",
}: {
  name: string;
  className?: string;
}) {
  const node = LINE_ICONS[name] ?? LINE_ICONS.compass;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {node}
    </svg>
  );
}
