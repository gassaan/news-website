"use client";

import { useEffect, useRef, useState } from "react";
import { albumPhotoSlug } from "@/lib/articles";
import ArticleImage from "./ArticleImage";

export default function AlbumViewer({ albumSlug, title, count }: { albumSlug: string; title: string; count: number }) {
  const photos = Array.from({ length: count }, (_, i) => albumPhotoSlug(albumSlug, i));
  const [startIndex, setStartIndex] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  function open(index: number, trigger: HTMLButtonElement) {
    triggerRef.current = trigger;
    currentRef.current = index;
    setCurrent(index);
    setStartIndex(index);
  }

  function close() {
    setStartIndex(null);
    triggerRef.current?.focus();
  }

  function go(index: number) {
    const slide = trackRef.current?.children[index];
    if (slide) slide.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  useEffect(() => {
    if (startIndex === null) return;
    const track = trackRef.current;
    if (!track) return;

    track.children[startIndex]?.scrollIntoView({ behavior: "instant", inline: "center", block: "nearest" });
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
      if (e.key === "Escape") {
        setStartIndex(null);
        triggerRef.current?.focus();
      }
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

  return (
    <>
      <div className="photo-grid">
        {photos.map((photo, i) => (
          <button
            key={photo}
            type="button"
            className="photo-tile"
            aria-label={`ފޮޓޯ ${i + 1}`}
            onClick={(e) => open(i, e.currentTarget)}
          >
            <ArticleImage slug={photo} alt="" />
          </button>
        ))}
      </div>

      {startIndex !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={title}>
          <div className="lb-top">
            <span className="lb-count num" dir="ltr">
              {current + 1} / {count}
            </span>
            <p className="lb-title">{title}</p>
            <button type="button" ref={closeRef} className="round-btn" aria-label="ބަންދުކުރޭ" onClick={close}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
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

          <button
            type="button"
            className="round-btn lb-prev"
            aria-label="ކުރީގެ ފޮޓޯ"
            disabled={current === 0}
            onClick={() => go(current - 1)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
          <button
            type="button"
            className="round-btn lb-next"
            aria-label="ދެން އޮތް ފޮޓޯ"
            disabled={current === count - 1}
            onClick={() => go(current + 1)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
