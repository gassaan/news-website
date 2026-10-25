"use client";

import { useEffect, useRef, useState } from "react";
import CategoryTile from "./CategoryTile";
import { Category } from "@/lib/articles";

const SPEED_PX_PER_SEC = 40;
const RESUME_DELAY_MS = 250;

export default function CategoryMarquee({ categories }: { categories: Category[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const posRef = useRef(0);
  // How many copies of the row to draw: enough that the screen never runs past the end
  // of the cards (wide computer screens need three or more), so the loop never stalls.
  const [copies, setCopies] = useState(2);
  const setWidthRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    function measure() {
      const el = trackRef.current;
      const first = el?.children[0] as HTMLElement | undefined;
      const repeat = el?.children[categories.length] as HTMLElement | undefined;
      if (!el || !first || !repeat) return;
      const set = Math.abs(repeat.offsetLeft - first.offsetLeft);
      setWidthRef.current = set;
      if (set > 0) setCopies(Math.max(2, Math.ceil(el.clientWidth / set) + 1));
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, [categories.length, copies]);

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
        const set = setWidthRef.current || el.scrollWidth / 2;
        posRef.current -= SPEED_PX_PER_SEC * dt;
        while (posRef.current <= -set) {
          posRef.current += set;
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
      {Array.from({ length: copies }, () => categories).flat().map((category, index) => (
        <CategoryTile key={`${category.slug}-${index}`} category={category} />
      ))}
    </div>
  );
}
