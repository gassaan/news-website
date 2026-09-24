"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ArticleImage from "./ArticleImage";

export default function Lightbox({
  photos,
  title,
  titles,
  startIndex,
  ratio = 3 / 2,
  onClose,
}: {
  photos: string[];
  title: string;
  titles?: string[];
  startIndex: number;
  ratio?: number;
  onClose: () => void;
}) {
  const count = photos.length;
  const [current, setCurrent] = useState(startIndex);
  const currentRef = useRef(startIndex);
  const trackRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  function go(index: number) {
    trackRef.current?.children[index]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    track.children[startIndex]?.scrollIntoView({ behavior: "auto", inline: "center", block: "nearest" });
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.index);
            currentRef.current = index;
            setCurrent(index);
          }
        }
      },
      { root: track, threshold: 0.6 },
    );
    for (const slide of Array.from(track.children)) observer.observe(slide);

    function goTo(index: number) {
      track?.children[index]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
      // RTL: the next photo sits to the left.
      if (e.key === "ArrowLeft") goTo(Math.min(count - 1, currentRef.current + 1));
      if (e.key === "ArrowRight") goTo(Math.max(0, currentRef.current - 1));
    }
    document.addEventListener("keydown", onKey);

    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [startIndex, count]);

  // Portal to <body>: a transformed or perspective ancestor (e.g. the coverflow) would trap position: fixed.
  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{ "--lb-r": ratio } as React.CSSProperties}
    >
      <div className="lb-top">
        <span className="lb-count num" dir="ltr">
          {current + 1} / {count}
        </span>
        <p className="lb-title">{titles?.[current] ?? title}</p>
        <button type="button" ref={closeRef} className="lb-btn" aria-label="ބަންދުކުރޭ" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="lb-track" ref={trackRef}>
        {photos.map((photo, i) => (
          <div key={photo} className="lb-slide" data-index={i}>
            <ArticleImage slug={photo} alt="" className="lb-img" />
          </div>
        ))}
      </div>

      <button type="button" className="lb-btn lb-prev" aria-label="ކުރީގެ" disabled={current === 0} onClick={() => go(current - 1)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
      <button type="button" className="lb-btn lb-next" aria-label="ދެން އޮތް" disabled={current === count - 1} onClick={() => go(current + 1)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </button>
    </div>,
    document.body,
  );
}
