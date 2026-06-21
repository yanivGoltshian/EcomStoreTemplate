import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";
import { pages, site } from "@/lib/data";

export const metadata: Metadata = {
  title: "תקנון האתר",
  description: `תקנון השימוש והרכישה באתר ${site.name} — תנאי שימוש, מחירים, אספקה, אחריות וביטול עסקה.`,
  alternates: { canonical: "/terms/" },
};

export default function TermsPage() {
  return <LegalLayout {...pages.terms} />;
}
