"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import type { DealFace } from "@/lib/types";

function formatPrice(n: number): string {
  return "₪" + n.toLocaleString("he-IL");
}

type Props = {
  faces: DealFace[];
  intervalMs?: number;
};

export default function DealsCube({ faces, intervalMs = 4500 }: Props) {
  const n = faces.length;
  const sceneRef = useRef<HTMLDivElement>(null);
  const swipeStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const resumePauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [radius, setRadius] = useState(0);
  const [turn, setTurn] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(true);

  const step = n > 0 ? 360 / n : 0;
  const active = n > 0 ? ((turn % n) + n) % n : 0;

  // Measure scene width → cube depth so faces line up as a true box.
  useLayoutEffect(() => {
    const el = sceneRef.current;
    if (!el || n < 2) return;
    const measure = () => {
      const w = el.clientWidth;
      let r: number;
      if (n === 2) r = w / 2;
      else r = w / 2 / Math.tan(Math.PI / n);
      setRadius(r);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [n]);

  // Respect reduced-motion.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Pause when offscreen or tab hidden.
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.2 }
    );
    io.observe(el);
    const onVis = () => setVisible(!document.hidden && document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Autoplay.
  useEffect(() => {
    if (n < 2 || reduced || paused || !visible) return;
    const t = setInterval(() => setTurn((x) => x + 1), Math.max(2000, intervalMs));
    return () => clearInterval(t);
  }, [n, reduced, paused, visible, intervalMs]);

  useEffect(() => {
    return () => {
      if (resumePauseTimerRef.current) clearTimeout(resumePauseTimerRef.current);
    };
  }, []);

  const resumeAfterSwipe = useCallback(() => {
    if (resumePauseTimerRef.current) clearTimeout(resumePauseTimerRef.current);
    resumePauseTimerRef.current = setTimeout(() => {
      setPaused(false);
      resumePauseTimerRef.current = null;
    }, 300);
  }, []);

  const goNext = useCallback(() => {
    if (n < 2) return;
    setTurn((x) => x + 1);
  }, [n]);

  const goPrev = useCallback(() => {
    if (n < 2) return;
    setTurn((x) => x - 1);
  }, [n]);

  const goTo = useCallback(
    (i: number) => {
      if (n < 2) return;
      setTurn((cur) => {
        const curMod = ((cur % n) + n) % n;
        const fwd = (i - curMod + n) % n;
        return cur + fwd;
      });
    },
    [n]
  );

  const onSwipePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (n < 2 || (e.pointerType !== "touch" && e.pointerType !== "pen")) return;
      if (resumePauseTimerRef.current) clearTimeout(resumePauseTimerRef.current);
      swipeStartRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
      setPaused(true);
    },
    [n]
  );

  const onSwipePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const start = swipeStartRef.current;
      if (!start || start.pointerId !== e.pointerId) return;
      swipeStartRef.current = null;

      const deltaX = e.clientX - start.x;
      const deltaY = e.clientY - start.y;
      if (Math.abs(deltaX) >= 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) goNext();
        else goPrev();
      }
      resumeAfterSwipe();
    },
    [goNext, goPrev, resumeAfterSwipe]
  );

  const onSwipePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const start = swipeStartRef.current;
      if (!start || start.pointerId !== e.pointerId) return;
      swipeStartRef.current = null;
      resumeAfterSwipe();
    },
    [resumeAfterSwipe]
  );

  if (n === 0) return null;

  const single = n === 1;

  return (
    <section className="container-x pt-8" aria-roledescription="carousel" aria-label="מבצעים חמים">
      <div className="mb-5 text-center">
        <h2 className="text-xl font-extrabold text-brand-red md:text-2xl">
          <span className="text-brand-gold">🔥</span> מבצעים חמים
        </h2>
        <p className="mt-1 text-sm font-light text-muted">דילים נבחרים — כל עוד המלאי נמשך</p>
      </div>

      <div className="relative mx-auto max-w-3xl">
        <div
          ref={sceneRef}
          className="relative h-[300px] touch-pan-y sm:h-[360px] lg:h-[400px]"
          style={{ perspective: single ? undefined : "1500px" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          onPointerDown={onSwipePointerDown}
          onPointerUp={onSwipePointerUp}
          onPointerCancel={onSwipePointerCancel}
        >
          <div
            className="absolute inset-0"
            style={
              single
                ? undefined
                : {
                    transformStyle: "preserve-3d",
                    transform: `translateZ(-${radius}px) rotateY(${-turn * step}deg)`,
                    transition: reduced ? "none" : "transform 750ms cubic-bezier(.45,.05,.3,1)",
                    willChange: "transform",
                  }
            }
          >
            {faces.map((face, i) => (
              <CubeFace
                key={face.id}
                face={face}
                isActive={single || i === active}
                style={
                  single
                    ? { position: "absolute", inset: 0 }
                    : {
                        position: "absolute",
                        inset: 0,
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: `rotateY(${i * step}deg) translateZ(${radius}px)`,
                      }
                }
              />
            ))}
          </div>

          {/* ground shadow */}
          {!single && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-6 -bottom-3 h-6 rounded-[50%] bg-black/25 blur-md"
            />
          )}
        </div>

        {!single && (
          <>
            <button
              type="button"
              onClick={goNext}
              aria-label="המבצע הבא"
              className="absolute right-1 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white/90 text-brand-red shadow-md transition hover:bg-white sm:-right-3 sm:grid"
            >
              <span className="text-2xl leading-none">‹</span>
            </button>
            <button
              type="button"
              onClick={goPrev}
              aria-label="המבצע הקודם"
              className="absolute left-1 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white/90 text-brand-red shadow-md transition hover:bg-white sm:-left-3 sm:grid"
            >
              <span className="text-2xl leading-none">›</span>
            </button>

            <div className="mt-4 flex justify-center gap-2">
              {faces.map((face, i) => (
                <button
                  key={face.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`מעבר למבצע ${i + 1}`}
                  aria-current={i === active}
                  className={`h-2.5 rounded-full transition-all ${
                    i === active ? "w-7 bg-brand-red" : "w-2.5 bg-black/20 hover:bg-black/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function CubeFace({
  face,
  style,
  isActive,
}: {
  face: DealFace;
  style: React.CSSProperties;
  isActive?: boolean;
}) {
  const hasDeal = typeof face.originalPrice === "number" && face.originalPrice > face.dealPrice;
  const pct = hasDeal
    ? Math.round((1 - face.dealPrice / (face.originalPrice as number)) * 100)
    : 0;

  return (
    <div style={style} aria-hidden={!isActive} inert={!isActive}>
      <Link
        href={face.href}
        className="card-hover group flex h-full w-full items-stretch overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,.12)]"
      >
        <div className="relative grid w-[44%] shrink-0 place-items-center bg-gradient-to-br from-[#fbfbfb] to-[#f1f1f1] p-3 sm:w-[46%] sm:p-5">
          {hasDeal && (
            <span className="absolute right-2 top-2 rounded-full bg-brand-red px-2.5 py-1 text-xs font-extrabold text-white shadow sm:text-sm">
              -{pct}%
            </span>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={face.image}
            alt={face.title}
            loading="lazy"
            onError={(e) => {
              if (e.currentTarget.dataset.fallback !== "true") {
                e.currentTarget.dataset.fallback = "true";
                e.currentTarget.src = "/images/placeholder.svg";
              }
            }}
            className="max-h-full max-w-full object-contain transition group-hover:scale-[1.03]"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-4 text-right sm:gap-3 sm:p-6">
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-gold/15 px-2.5 py-1 text-[11px] font-bold text-brand-red sm:text-xs">
            {hasDeal ? "✦ מבצע מיוחד" : "✦ מוצר נבחר"}
          </span>

          <h3 className="line-clamp-2 text-base font-extrabold leading-tight text-gray-900 sm:text-xl">
            {face.title}
          </h3>

          <div className="flex flex-wrap items-baseline justify-end gap-x-3 gap-y-1">
            {hasDeal && (
              <span className="text-sm text-muted line-through sm:text-base">
                {formatPrice(face.originalPrice as number)}
              </span>
            )}
            <span className="text-2xl font-black text-brand-red sm:text-3xl">
              {formatPrice(face.dealPrice)}
            </span>
          </div>

          {hasDeal && (
            <span className="text-xs font-bold text-green-700 sm:text-sm">
              חיסכון {formatPrice((face.originalPrice as number) - face.dealPrice)}
            </span>
          )}

          <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-lg bg-brand-red px-4 py-2 text-sm font-bold text-white transition group-hover:bg-brand-red-dark">
            לרכישה ‹
          </span>
        </div>
      </Link>
    </div>
  );
}
