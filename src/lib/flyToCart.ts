/**
 * Fly-to-cart animation using the native Web Animations API (no GSAP, 0 bundle cost).
 * Clones the product image and animates it in an arc into the header cart icon.
 * Silently no-ops when the target is missing or the user prefers reduced motion.
 */

const TARGET_ID = "cart-fly-target";

export function flyToCart(imageSrc: string, origin: HTMLElement | null | undefined): void {
  if (typeof window === "undefined" || !imageSrc || !origin) return;

  // Respect reduced-motion.
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    pulseTarget();
    return;
  }

  const target = document.getElementById(TARGET_ID);
  if (!target || typeof (Element.prototype as unknown as { animate?: unknown }).animate !== "function") {
    return;
  }

  const originRect = origin.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  if (originRect.width === 0 || targetRect.width === 0) return;

  const size = Math.max(60, Math.min(originRect.width, 170));
  const startX = originRect.left + originRect.width / 2;
  const startY = originRect.top + originRect.height / 2;
  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;
  const dx = endX - startX;
  const dy = endY - startY;

  const clone = document.createElement("img");
  clone.src = imageSrc;
  clone.setAttribute("aria-hidden", "true");
  clone.alt = "";
  Object.assign(clone.style, {
    position: "fixed",
    left: `${startX - size / 2}px`,
    top: `${startY - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    objectFit: "contain",
    borderRadius: "12px",
    background: "#fff",
    boxShadow: "0 10px 28px rgba(0,0,0,.22)",
    padding: "4px",
    pointerEvents: "none",
    zIndex: "9999",
    willChange: "transform, opacity",
  } as Partial<CSSStyleDeclaration>);

  document.body.appendChild(clone);

  const anim = clone.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 1, offset: 0 },
      {
        transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 70}px) scale(0.72)`,
        opacity: 0.95,
        offset: 0.55,
      },
      { transform: `translate(${dx}px, ${dy}px) scale(0.16)`, opacity: 0.35, offset: 1 },
    ],
    { duration: 750, easing: "cubic-bezier(.5,.02,.62,.36)", fill: "forwards" },
  );

  const cleanup = () => {
    clone.remove();
    pulseTarget();
  };
  anim.addEventListener("finish", cleanup, { once: true });
  anim.addEventListener("cancel", () => clone.remove(), { once: true });
  // Safety net in case the finish event never fires.
  window.setTimeout(cleanup, 1100);
}

function pulseTarget() {
  const target = document.getElementById(TARGET_ID);
  if (!target) return;
  target.classList.remove("cart-fly-hit");
  // Force reflow so the animation restarts on rapid re-adds.
  void target.offsetWidth;
  target.classList.add("cart-fly-hit");
  window.setTimeout(() => target.classList.remove("cart-fly-hit"), 520);
}
