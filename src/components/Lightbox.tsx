"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ArticleImage from "./ArticleImage";
import { fullImage } from "@/lib/cmsImages";

export default function Lightbox({
  photos,
  title,
  titles,
  startIndex,
  ratio = 3 / 2,
  saveable = false,
  onClose,
}: {
  photos: string[];
  title: string;
  titles?: string[];
  startIndex: number;
  ratio?: number;
  // Adds save and share buttons for the photo on screen.
  saveable?: boolean;
  onClose: () => void;
}) {
  const count = photos.length;
  const [current, setCurrent] = useState(startIndex);
  const currentRef = useRef(startIndex);
  const trackRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const [toastVisible, setToastVisible] = useState(false);
  // The photo on screen as a file, fetched ahead so sharing stays inside the tap.
  const fileRef = useRef<{ slug: string; file: File } | null>(null);
  const slug = photos[current];
  const download = saveable ? fullImage(slug) : undefined;

  useEffect(() => {
    if (!download || fileRef.current?.slug === slug) return;
    let cancelled = false;
    fetch(download)
      .then((res) => (res.ok ? res.blob() : Promise.reject()))
      .then((blob) => {
        if (!cancelled) {
          fileRef.current = {
            slug,
            file: new File([blob], `hulhangu-${slug}.jpg`, {
              type: blob.type || "image/jpeg",
            }),
          };
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [download, slug]);

  async function share() {
    const url = window.location.href.split("#")[0];
    const name = titles?.[current] ?? title;
    const file =
      fileRef.current?.slug === slug ? fileRef.current.file : undefined;
    if (navigator.share) {
      try {
        if (file && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: name });
        } else {
          await navigator.share({ title: name, url });
        }
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2000);
    } catch {
      window.prompt("ލިންކު:", url);
    }
  }

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  function go(index: number) {
    trackRef.current?.children[index]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    track.children[startIndex]?.scrollIntoView({
      behavior: "auto",
      inline: "center",
      block: "nearest",
    });
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
      track?.children[index]?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
      // RTL: the next photo sits to the left.
      if (e.key === "ArrowLeft")
        goTo(Math.min(count - 1, currentRef.current + 1));
      if (e.key === "ArrowRight") goTo(Math.max(0, currentRef.current - 1));
    }
    document.addEventListener("keydown", onKey);

    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [startIndex, count]);

  // Portal to <body>: a transformed or perspective ancestor would trap position: fixed.
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
        <button
          type="button"
          ref={closeRef}
          className="lb-btn"
          aria-label="ބަންދުކުރޭ"
          onClick={onClose}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
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

      {saveable && (
        <div className="lb-acts">
          {download && (
            <a
              className="lb-btn"
              href={`${download}&dl=hulhangu-${slug}.jpg`}
              aria-label="ސޭވް ކުރައްވާ"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
              </svg>
            </a>
          )}
          <button
            type="button"
            className="lb-btn"
            aria-label="ޝެއަރ ކުރައްވާ"
            onClick={share}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
            </svg>
          </button>
          <p className="lb-toast" role="status" hidden={!toastVisible}>
            ލިންކު ކޮޕީ ކުރެވިއްޖެ
          </p>
        </div>
      )}

      <button
        type="button"
        className="lb-btn lb-prev"
        aria-label="ކުރީގެ"
        disabled={current === 0}
        onClick={() => go(current - 1)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
      <button
        type="button"
        className="lb-btn lb-next"
        aria-label="ދެން އޮތް"
        disabled={current === count - 1}
        onClick={() => go(current + 1)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </button>
    </div>,
    document.body,
  );
}
