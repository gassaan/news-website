"use client";

import { useEffect, useRef } from "react";
import CategoryTile from "./CategoryTile";
import { Category } from "@/lib/articles";

const SPEED_PX_PER_SEC = 28;
const RESUME_DELAY_MS = 250;

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
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;
    let programmaticScroll = false;

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
        programmaticScroll = true;
        el.scrollLeft = posRef.current;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    function scheduleResume() {
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        const el = trackRef.current;
        if (el) posRef.current = el.scrollLeft;
        pausedRef.current = false;
      }, RESUME_DELAY_MS);
    }

    // Any real (non-programmatic) scroll - a drag, or the momentum that
    // continues after the finger lifts - keeps autoplay paused and pushes
    // the resume out until motion actually settles, so it never fights
    // the browser's own scroll and snaps back to a stale position.
    function onScroll() {
      if (programmaticScroll) {
        programmaticScroll = false;
        return;
      }
      pausedRef.current = true;
      scheduleResume();
    }

    function onPointerDown() {
      pausedRef.current = true;
      if (resumeTimer) clearTimeout(resumeTimer);
    }

    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      if (resumeTimer) clearTimeout(resumeTimer);
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("scroll", onScroll);
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
