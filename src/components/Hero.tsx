import Link from "next/link";
import { homepage } from "@/lib/data";

export default function Hero() {
  const { image, alt, href } = homepage.hero;
  return (
    <section>
      <Link href={href} className="block" aria-label={alt}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={alt}
          className="block h-auto w-full"
          fetchPriority="high"
        />
      </Link>
    </section>
  );
}
