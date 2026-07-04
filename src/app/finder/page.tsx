import type { Metadata } from "next";
import FinderClient from "@/components/FinderClient";
import { site } from "@/lib/data";

export const metadata: Metadata = {
  title: "מצאו את המוצר המושלם",
  description: `לא בטוחים מה לבחור? ענו על כמה שאלות קצרות ונתאים לכם מוצרים מתוך מאות מוצרי החשמל של ${site.name} — לפי תחום, תקציב והעדפה.`,
  alternates: { canonical: "/finder/" },
};

export default function FinderPage() {
  return (
    <div className="bg-soft pb-16">
      <FinderClient />
    </div>
  );
}
