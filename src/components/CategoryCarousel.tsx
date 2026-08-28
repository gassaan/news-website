"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { categories } from "@/lib/articles";
import NewsIllustration from "./NewsIllustration";

export default function CategoryCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const interactingRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mouseDragRef = useRef<{
    startX: number;
    startScroll: number;
    moved: boolean;
  } | null>(null);
  const track = [...categories, ...categories, ...categories];

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth / 3;

    let raf: number;
    function step() {
      if (el && !interactingRef.current) {
        const setWidth = el.scrollWidth / 3;
        el.scrollLeft += 0.6;
        if (el.scrollLeft >= setWidth * 2) el.scrollLeft -= setWidth;
      }
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  function pauseForInteraction() {
    interactingRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  }

  function scheduleResume() {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      interactingRef.current = false;
    }, 600);
  }

  function normalizeLoop() {
    const el = trackRef.current;
    if (!el) return;
    const setWidth = el.scrollWidth / 3;
    if (el.scrollLeft >= setWidth * 2) el.scrollLeft -= setWidth;
    if (el.scrollLeft <= 0) el.scrollLeft += setWidth;
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    pauseForInteraction();
    if (e.pointerType === "mouse") {
      const el = trackRef.current;
      if (!el) return;
      mouseDragRef.current = {
        startX: e.clientX,
        startScroll: el.scrollLeft,
        moved: false,
      };
      el.setPointerCapture(e.pointerId);
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || !mouseDragRef.current) return;
    const el = trackRef.current;
    if (!el) return;
    const dx = e.clientX - mouseDragRef.current.startX;
    if (Math.abs(dx) > 5) mouseDragRef.current.moved = true;
    el.scrollLeft = mouseDragRef.current.startScroll - dx;
  }

  function handlePointerUp() {
    normalizeLoop();
    scheduleResume();
    mouseDragRef.current = null;
  }

  function handleLinkClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (mouseDragRef.current?.moved) {
      e.preventDefault();
    }
  }

  return (
    <div
      ref={trackRef}
      dir="ltr"
      onScroll={normalizeLoop}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={pauseForInteraction}
      onMouseLeave={scheduleResume}
      className="[&::-webkit-scrollbar]:hidden flex cursor-grab gap-4 overflow-x-auto px-4 py-2 active:cursor-grabbing"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {track.map((category, index) => (
        <Link
          key={`${category.slug}-${index}`}
          href={`/category/${category.slug}`}
          dir="rtl"
          onClick={handleLinkClick}
          className="group relative block h-56 w-40 shrink-0 overflow-hidden rounded-2xl select-none sm:h-64 sm:w-48"
        >
          <NewsIllustration
            category={category.slug}
            className="pointer-events-none absolute inset-0 flex h-full w-full items-center justify-center"
          />
          <div className="pointer-events-none absolute inset-0 bg-black/45 transition-colors group-hover:bg-black/55" />
          <span className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-lg font-bold text-white sm:text-xl">
            {category.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
