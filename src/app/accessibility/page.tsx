import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";
import { pages, site } from "@/lib/data";

export const metadata: Metadata = {
  title: "הצהרת נגישות",
  description: `הצהרת הנגישות של ${site.name} — מחויבותנו לשיפור נגישות האתר ולמתן שירות נגיש לכלל הלקוחות.`,
  alternates: { canonical: "/accessibility/" },
};

export default function AccessibilityPage() {
  return <LegalLayout {...pages.accessibility} />;
}
