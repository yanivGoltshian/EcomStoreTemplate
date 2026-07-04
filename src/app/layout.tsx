import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ConditionalChrome from "@/components/ConditionalChrome";
import ScrollToTop from "@/components/ScrollToTop";
import PWARegister from "@/components/PWARegister";
import ScrollReveal from "@/components/ScrollReveal";
import QuickViewModal from "@/components/QuickViewModal";
import InstallPrompt from "@/components/InstallPrompt";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { QuickViewProvider } from "@/lib/quickview";
import { site } from "@/lib/data";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700", "800", "900"],
  variable: "--font-heebo",
  display: "swap",
});

// Derive a darker shade of the brand color (used for hover/active states).
function darken(hex: string, amt = 0.18): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amt)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amt)));
  const b = Math.max(0, Math.round((n & 255) * (1 - amt)));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const brandPrimary = site.theme?.primary || "#2563eb";
const brandPrimaryDark = darken(brandPrimary);

// Favicon / app icons. When the admin uploads a custom favicon
// (site.favicon set) it becomes authoritative for the tab icon, the
// apple-touch icon and the shortcut. Otherwise fall back to the bundled
// branded icons in public/ (icon.svg + favicon.ico + apple-icon.png).
const iconsMeta: Metadata["icons"] = site.favicon
  ? {
      icon: [
        { url: site.favicon, type: "image/png" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      shortcut: [{ url: site.favicon }],
      apple: [{ url: site.favicon }],
    }
  : {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
    };

const title = `${site.name} | ${site.tagline}`;
const description = site.description?.trim() || `${site.name} — ${site.tagline}`;
const ogLocale = site.locale.replace("-", "_");

export const metadata: Metadata = {
  metadataBase: new URL(site.deployUrl),
  title: {
    default: title,
    template: `%s | ${site.name}`,
  },
  description,
  applicationName: site.name,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: site.name,
  },
  keywords:
    site.keywords && site.keywords.length
      ? site.keywords
      : [site.name, site.nameEn].filter(Boolean),
  authors: [{ name: site.name }],
  creator: site.name,
  publisher: site.name,
  formatDetection: { telephone: true, address: true, email: true },
  icons: iconsMeta,
  alternates: {
    canonical: "/",
    languages: { [site.locale]: "/" },
  },
  openGraph: {
    title,
    description,
    url: site.url,
    siteName: site.name,
    locale: ogLocale,
    type: "website",
    images: [
      {
        url: site.ogImage,
        width: 1200,
        height: 630,
        alt: `${site.name} — ${site.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [site.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  ...(site.googleSiteVerification
    ? { verification: { google: site.googleSiteVerification } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: brandPrimary,
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

function Analytics() {
  const gaId = site.analytics?.googleAnalyticsId?.trim();
  if (!gaId) return null;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`,
        }}
      />
    </>
  );
}

function StructuredData() {
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Store", "LocalBusiness", "Organization"],
        "@id": `${site.url}/#store`,
        name: site.name,
        alternateName: site.nameEn,
        legalName: site.legalName,
        url: site.url,
        image: `${site.deployUrl}${site.ogImage}`,
        description,
        telephone: site.phone,
        priceRange: "₪₪",
        address: {
          "@type": "PostalAddress",
          streetAddress: site.address.street,
          addressLocality: site.address.city,
          postalCode: site.address.postalCode,
          addressCountry: site.address.country,
        },
        openingHoursSpecification: site.openingHours.map((h) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: h.days,
          opens: h.opens,
          closes: h.closes,
        })),
        contactPoint: {
          "@type": "ContactPoint",
          telephone: site.phone,
          contactType: "customer service",
          areaServed: "IL",
          availableLanguage: [site.lang],
        },
        sameAs: [site.facebook, site.instagram].filter(Boolean),
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: site.url,
        name: site.name,
        inLanguage: site.locale,
        publisher: { "@id": `${site.url}/#store` },
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang={site.lang}
      dir={site.dir}
      className={heebo.variable}
      style={
        {
          "--color-brand-red": brandPrimary,
          "--color-brand-red-dark": brandPrimaryDark,
        } as React.CSSProperties
      }
    >
      <body className="overflow-x-hidden">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.setAttribute('data-gsap-anim','')}}catch(e){}",
          }}
        />
        <ScrollToTop />
        <PWARegister />
        <ScrollReveal />
        <StructuredData />
        <Analytics />
        <CartProvider>
          <WishlistProvider>
            <QuickViewProvider>
              <ConditionalChrome
                header={<SiteHeader />}
                footer={<SiteFooter />}
              >
                {children}
              </ConditionalChrome>
              <InstallPrompt />
              <QuickViewModal />
            </QuickViewProvider>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
