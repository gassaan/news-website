"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";

export default function SectionCarousel({
  id,
  title,
  moreHref,
  children,
}: {
  id?: string;
  title: string;
  moreHref?: string;
  children: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollPrev() {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.9, behavior: "smooth" });
  }

  function scrollNext() {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: -el.clientWidth * 0.9, behavior: "smooth" });
  }

  return (
    <section id={id} className="wrap">
      <div className="sec-head">
        <h2>{title}</h2>
        {moreHref && (
          <Link className="more" href={moreHref}>
            އިތުރު ލިޔުން <span aria-hidden="true">‹</span>
          </Link>
        )}
      </div>
      <div className="carousel">
        <button type="button" className="arrow prev" aria-label="Previous" onClick={scrollPrev}>
          <svg width="14" height="26" viewBox="0 0 13 26" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 1l11 12L1 25" />
          </svg>
        </button>
        <button type="button" className="arrow next" aria-label="Next" onClick={scrollNext}>
          <svg width="14" height="26" viewBox="0 0 13 26" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 1L1 13l11 12" />
          </svg>
        </button>
        <div className="track" ref={trackRef}>
          {children}
        </div>
      </div>
    </section>
  );
}
