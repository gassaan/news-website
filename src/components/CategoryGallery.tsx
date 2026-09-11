"use client";

import { useRef } from "react";
import { Category } from "@/lib/articles";
import CategoryShowcaseCard from "./CategoryShowcaseCard";

export default function CategoryGallery({
  categories,
}: {
  categories: Category[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startScrollRef = useRef(0);
  const movedRef = useRef(false);

  function handleMouseMove(e: MouseEvent) {
    const el = trackRef.current;
    if (!el) return;
    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 5) movedRef.current = true;
    // Chromium/Firefox use a negative scrollLeft range for RTL containers
    // (0 = start/rightmost), so a leftward drag (negative dx) must move
    // scrollLeft further negative, not positive.
    el.scrollLeft = startScrollRef.current + dx;
  }

  function handleMouseUp() {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    const el = trackRef.current;
    if (!el) return;
    movedRef.current = false;
    startXRef.current = e.clientX;
    startScrollRef.current = el.scrollLeft;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  function handleClickCapture(e: React.MouseEvent) {
    if (movedRef.current) {
      e.preventDefault();
      movedRef.current = false;
    }
  }

  return (
    <div
      ref={trackRef}
      dir="rtl"
      onMouseDown={handleMouseDown}
      onClickCapture={handleClickCapture}
      className="[&::-webkit-scrollbar]:hidden mx-auto flex max-w-5xl cursor-grab gap-3 overflow-x-auto px-4 pb-2 select-none active:cursor-grabbing sm:gap-4 sm:px-6"
      style={{ scrollbarWidth: "none" }}
    >
      {categories.map((category) => (
        <CategoryShowcaseCard key={category.slug} category={category} />
      ))}
    </div>
  );
}
