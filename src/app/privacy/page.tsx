import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";
import { pages, site } from "@/lib/data";

export const metadata: Metadata = {
  title: "מדיניות פרטיות",
  description: `מדיניות הפרטיות של ${site.name} — כיצד אנו אוספים, משתמשים ושומרים על המידע האישי שלכם.`,
  alternates: { canonical: "/privacy/" },
};

export default function PrivacyPage() {
  return <LegalLayout {...pages.privacy} />;
}
