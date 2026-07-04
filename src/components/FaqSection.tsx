import { site } from "@/lib/data";

const FAQS: { q: string; a: string }[] = [
  {
    q: "איך מזמינים באתר?",
    a: "בוחרים מוצרים, מוסיפים לעגלה ושולחים את ההזמנה לספק בוואטסאפ או בטלפון. בתבנית הדמו אין סליקה אונליין, כדי שתוכלו לחבר בהמשך את תהליך ההזמנה שמתאים לחנות שלכם.",
  },
  {
    q: "האם אפשר להחליף את המוצרים והתמונות?",
    a: "כן. כל המוצרים, הקטגוריות, התמונות, המחירים ותוכן העמודים נועדו לעריכה דרך נתוני התבנית או ממשק הניהול.",
  },
  {
    q: "מה לגבי משלוחים ואיסוף עצמי?",
    a: "אפשר להגדיר מדיניות משלוחים, אזורי שירות ואפשרויות איסוף בהתאם לעסק שלכם. מומלץ לציין עלויות, זמני אספקה ותנאי משלוח בצורה ברורה בעמודי התוכן.",
  },
  {
    q: "האם המוצרים מגיעים עם אחריות?",
    a: "בתבנית מומלץ לפרט לכל מוצר או קטגוריה את תנאי האחריות הרלוונטיים. אפשר להשתמש בטקסט כללי כמו אחריות יבואן או אחריות חנות, לפי הצורך.",
  },
  {
    q: "איך מטפלים בהחזרות והחלפות?",
    a: "הגדירו מדיניות החזרות ברורה: חלון זמן, מצב המוצר, אריזה מקורית, ואופן יצירת קשר. התבנית כוללת עמוד החזרות שאפשר להתאים לעסק.",
  },
  {
    q: "אפשר לקבל ייעוץ לפני הקנייה?",
    a: "כן. מומלץ להשאיר כפתורי טלפון ווואטסאפ פעילים כדי שלקוחות יוכלו לשאול שאלות, לוודא מלאי ולבחור את המוצר המתאים לפני ההזמנה.",
  },
];

export default function FaqSection() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <section className="container-x mt-14" aria-labelledby="faq-heading" data-reveal>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <div className="mx-auto max-w-3xl">
        <h2
          id="faq-heading"
          className="text-center text-xl font-extrabold text-heading md:text-2xl"
        >
          <span className="text-brand-gold">✦</span> שאלות נפוצות
        </h2>
        <p className="mt-1.5 mb-6 text-center text-sm font-light text-muted">
          כל מה שחשוב לדעת לפני שמזמינים מ{site.name}
        </p>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <details
              key={i}
              className="group rounded-xl border bg-white px-5 py-3.5 shadow-sm open:shadow-md"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[0.95rem] font-bold text-heading">
                <span>{f.q}</span>
                <span
                  className="shrink-0 text-lg leading-none text-brand-red transition-transform group-open:rotate-45"
                  aria-hidden
                >
                  ＋
                </span>
              </summary>
              <p className="mt-2.5 whitespace-pre-line text-[0.875rem] font-light leading-relaxed text-muted">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
