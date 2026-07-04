import { site } from "@/lib/data";

function readReviewsHref(): string | null {
  const u = site.googleReviewUrl;
  if (!u) return null;
  const m = u.match(/placeid=([^&]+)/i);
  if (m) return `https://search.google.com/local/reviews?placeid=${m[1]}`;
  return u;
}

export default function CustomerVoices() {
  const reviews = (site.reviews ?? []).slice(0, 6);
  if (reviews.length === 0) return null;

  const readHref = readReviewsHref();

  return (
    <section aria-labelledby="voices-heading" className="border-t bg-soft">
      <div className="container-x py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="voices-heading" className="text-sm font-bold text-muted">
              מה הלקוחות מספרים עלינו
            </h2>
            {readHref ? (
              <a
                href={readHref}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-[0.78rem] font-semibold text-brand-red hover:underline"
              >
                כל הביקורות ב‑Google ←
              </a>
            ) : null}
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r, i) => (
              <li
                key={i}
                className="rounded-lg border bg-white/70 p-3.5 text-[0.8rem] leading-relaxed"
              >
                <p className="text-[0.8rem] leading-none text-brand-gold" aria-hidden>
                  {"★".repeat(Math.max(1, Math.min(5, Math.round(r.rating ?? 5))))}
                </p>
                <p className="mt-1.5 text-ink">{r.text}</p>
                <p className="mt-2 text-[0.72rem] font-semibold text-heading">
                  {r.author}
                  {r.source ? <span className="font-normal text-muted"> · {r.source}</span> : null}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
