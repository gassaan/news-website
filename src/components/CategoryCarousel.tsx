"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { categories } from "@/lib/articles";
import NewsIllustration from "./NewsIllustration";

export default function CategoryCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const track = [...categories, ...categories, ...categories];

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const singleSetWidth = el.scrollWidth / 3;
    el.scrollLeft = singleSetWidth;

    let raf: number;
    function step() {
      if (el && !paused && !draggingRef.current) {
        const setWidth = el.scrollWidth / 3;
        el.scrollLeft += 0.6;
        if (el.scrollLeft >= setWidth * 2) {
          el.scrollLeft -= setWidth;
        }
      }
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [paused]);

  function normalizeLoop() {
    const el = trackRef.current;
    if (!el) return;
    const setWidth = el.scrollWidth / 3;
    if (el.scrollLeft >= setWidth * 2) el.scrollLeft -= setWidth;
    if (el.scrollLeft <= 0) el.scrollLeft += setWidth;
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = trackRef.current;
    if (!el) return;
    draggingRef.current = true;
    movedRef.current = false;
    startXRef.current = e.clientX;
    startScrollRef.current = el.scrollLeft;
    el.setPointerCapture(e.pointerId);
    setPaused(true);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = trackRef.current;
    if (!el || !draggingRef.current) return;
    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 5) movedRef.current = true;
    el.scrollLeft = startScrollRef.current - dx;
  }

  function handlePointerUp() {
    draggingRef.current = false;
    normalizeLoop();
    setPaused(false);
  }

  function handleLinkClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (movedRef.current) {
      e.preventDefault();
    }
  }

  return (
    <div
      ref={trackRef}
      dir="ltr"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="[&::-webkit-scrollbar]:hidden flex cursor-grab touch-pan-y gap-4 overflow-x-auto px-4 py-2 active:cursor-grabbing"
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
