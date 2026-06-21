import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";
import { pages, site } from "@/lib/data";

export const metadata: Metadata = {
  title: "ביטולים והחזרות",
  description: `מדיניות הביטולים וההחזרות של ${site.name} — דרכי ביטול עסקה, החזר כספי, דמי ביטול וחריגים בהתאם לחוק הגנת הצרכן.`,
  alternates: { canonical: "/returns/" },
};

export default function ReturnsPage() {
  return <LegalLayout {...pages.returns} />;
}
