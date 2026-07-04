"use client";

import { useEffect } from "react";

/**
 * Tasteful, progressive-enhancement scroll animations (GSAP + ScrollTrigger).
 *
 * - Runs ONLY when <html data-gsap-anim> is present. That attribute is set by a
 *   tiny synchronous script in layout.tsx, which skips setting it when the user
 *   prefers reduced motion. So reduced-motion users and no-JS crawlers never get
 *   the hidden-then-revealed state — content is fully visible for them.
 * - GSAP is dynamically imported so it never weighs down the initial bundle / LCP.
 * - A fail-safe timeout removes the gate if GSAP ever fails to load, so content is
 *   never left permanently hidden.
 *
 * Targets (add these plain attributes to server-rendered markup — SSR/SEO safe):
 *   data-reveal        -> element slides up + fades in on scroll
 *   data-reveal-group  -> its children stagger slide-up + fade in on scroll
 *   data-reveal-pop    -> its children stagger scale-pop + fade in on scroll
 */
export default function ScrollReveal() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.hasAttribute("data-gsap-anim")) return; // reduced motion / gate absent

    let cancelled = false;
    let ctx: { revert: () => void } | undefined;
    const clearGate = () => root.removeAttribute("data-gsap-anim");
    const failSafe = window.setTimeout(clearGate, 2500);

    (async () => {
      try {
        const gsapMod = await import("gsap");
        const stMod = await import("gsap/ScrollTrigger");
        if (cancelled) return;
        const gsap = gsapMod.gsap ?? gsapMod.default;
        const ScrollTrigger = stMod.ScrollTrigger ?? stMod.default;
        gsap.registerPlugin(ScrollTrigger);
        window.clearTimeout(failSafe);

        ctx = gsap.context(() => {
          const toArr = (sel: string) => gsap.utils.toArray<HTMLElement>(sel);
          const singles = toArr("[data-reveal]");
          const groups = toArr("[data-reveal-group]");
          const pops = toArr("[data-reveal-pop]");

          const kids = (els: HTMLElement[]) =>
            els.flatMap((el) => Array.from(el.children) as HTMLElement[]);

          // Apply the from-state as inline styles, THEN drop the CSS gate so there
          // is no flash (inline styles keep the targets hidden until they animate).
          gsap.set([...singles, ...kids(groups)], { opacity: 0, y: 24 });
          gsap.set(kids(pops), { opacity: 0, scale: 0.6 });
          clearGate();

          singles.forEach((el) =>
            gsap.to(el, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: { trigger: el, start: "top 85%", once: true },
            }),
          );

          groups.forEach((g) =>
            gsap.to(Array.from(g.children) as HTMLElement[], {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: "power2.out",
              stagger: 0.08,
              scrollTrigger: { trigger: g, start: "top 85%", once: true },
            }),
          );

          pops.forEach((p) =>
            gsap.to(Array.from(p.children) as HTMLElement[], {
              opacity: 1,
              scale: 1,
              duration: 0.5,
              ease: "back.out(1.6)",
              stagger: 0.06,
              scrollTrigger: { trigger: p, start: "top 85%", once: true },
            }),
          );
        });
      } catch {
        clearGate();
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(failSafe);
      clearGate();
      try {
        ctx?.revert();
      } catch {
        /* noop */
      }
    };
  }, []);

  return null;
}
