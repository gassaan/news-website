"use client";

import { useEffect, useRef } from "react";
import CategoryTile from "./CategoryTile";
import { Category } from "@/lib/articles";

const SPEED_PX_PER_SEC = 28;

export default function CategoryMarquee({ categories }: { categories: Category[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const posRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf: number;
    let last: number | null = null;

    function tick(now: number) {
      const el = trackRef.current;
      if (!el) return;
      if (last === null) last = now;
      const dt = (now - last) / 1000;
      last = now;

      if (!pausedRef.current) {
        const half = el.scrollWidth / 2;
        posRef.current -= SPEED_PX_PER_SEC * dt;
        if (posRef.current <= -half) {
          posRef.current += half;
        }
        el.scrollLeft = posRef.current;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    function pause() {
      pausedRef.current = true;
    }
    function resume() {
      const el = trackRef.current;
      if (el) posRef.current = el.scrollLeft;
      pausedRef.current = false;
    }

    track.addEventListener("pointerdown", pause);
    track.addEventListener("pointerup", resume);
    track.addEventListener("pointercancel", resume);
    track.addEventListener("mouseenter", pause);
    track.addEventListener("mouseleave", resume);

    return () => {
      cancelAnimationFrame(raf);
      track.removeEventListener("pointerdown", pause);
      track.removeEventListener("pointerup", resume);
      track.removeEventListener("pointercancel", resume);
      track.removeEventListener("mouseenter", pause);
      track.removeEventListener("mouseleave", resume);
    };
  }, []);

  return (
    <div className="cats" ref={trackRef}>
      {[...categories, ...categories].map((category, index) => (
        <CategoryTile key={`${category.slug}-${index}`} category={category} />
      ))}
    </div>
  );
}
