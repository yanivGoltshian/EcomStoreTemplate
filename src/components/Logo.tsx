import Link from "next/link";
import { site } from "@/lib/data";

export default function Logo({ onLight = false }: { onLight?: boolean }) {
  void onLight;
  const logoImage = site.logo?.image || "/images/brand/logo.png";
  const logoAlt = site.logo?.alt || site.name;
  return (
    <Link
      href="/"
      aria-label={`${logoAlt} — לדף הבית`}
      className="inline-flex shrink-0 items-center"
    >
      <img
        src={logoImage}
        alt={logoAlt}
        style={{ width: "auto" }}
        className="block h-[34px] w-auto select-none sm:h-[44px]"
        draggable={false}
        loading="eager"
        decoding="async"
      />
    </Link>
  );
}
