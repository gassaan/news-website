"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// A thin glowing line along the bottom of the top bar that fills from right to
// left (the reading direction) as the article text is read. Empty until the text
// reaches the bar, full when its end is on screen.
export default function ReadProgress({ targetId }: { targetId: string }) {
  const [header, setHeader] = useState<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const bar = document.querySelector<HTMLElement>("header.site");
    const text = document.getElementById(targetId);
    if (!bar || !text) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const top = bar.getBoundingClientRect().bottom;
      const box = text.getBoundingClientRect();
      const span = box.height - (window.innerHeight - top);
      const p = span > 0 ? (top - box.top) / span : box.top < top ? 1 : 0;
      setProgress(Math.min(1, Math.max(0, p)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    // Mount into the header once it's in the page; measure on the next frame.
    const first = requestAnimationFrame(() => {
      setHeader(bar);
      measure();
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [targetId]);

  if (!header) return null;
  return createPortal(
    <div
      className="read-progress"
      role="progressbar"
      aria-label="ކިޔުނު މިންވަރު"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
    >
      <span style={{ width: `${progress * 100}%` }} />
    </div>,
    header,
  );
}
