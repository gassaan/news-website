"use client";

import { useEffect, useRef, useState } from "react";
import ArticleImage from "./ArticleImage";
import Lightbox from "./Lightbox";
import { GRAPHIC_RATIO, Graphic } from "@/lib/articles";

const AUTO_MS = 4500;
// After a swipe or tap, wait this long before moving on by itself again.
const RESUME_MS = 8000;
const NEW_FOR_MS = 2 * 24 * 60 * 60 * 1000;

export default function GraphicsSwipe({ graphics }: { graphics: Graphic[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const openRef = useRef(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [now, setNow] = useState<number | null>(null);

  function goTo(i: number) {
    const track = trackRef.current;
    const card = track?.children[i] as HTMLElement | undefined;
    if (!track || !card) return;
    const cardCenter = card.getBoundingClientRect().left + card.offsetWidth / 2;
    const trackCenter =
      track.getBoundingClientRect().left + track.clientWidth / 2;
    track.scrollBy({ left: cardCenter - trackCenter, behavior: "smooth" });
  }

  // The card nearest the middle is the current one.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame: number | null = null;
    function update() {
      frame = null;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      let nearest = 0;
      let best = Infinity;
      (Array.from(track.children) as HTMLElement[]).forEach((card, i) => {
        const r = card.getBoundingClientRect();
        const dist = Math.abs(r.left + r.width / 2 - center);
        if (dist < best) {
          best = dist;
          nearest = i;
        }
      });
      if (nearest !== activeRef.current) {
        activeRef.current = nearest;
        setActive(nearest);
      }
    }
    function onScroll() {
      if (frame == null) frame = requestAnimationFrame(update);
    }
    setNow(Date.now());
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame != null) cancelAnimationFrame(frame);
    };
  }, []);

  // Moves to the next graphic every few seconds, only while it is on screen and
  // nobody is touching it; back to the first after the last.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || graphics.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let visible = false;
    let pausedUntil = 0;
    const pause = () => {
      pausedUntil = Date.now() + RESUME_MS;
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.5 },
    );
    observer.observe(track);
    const timer = setInterval(() => {
      if (
        !visible ||
        openRef.current ||
        document.hidden ||
        Date.now() < pausedUntil
      )
        return;
      goTo((activeRef.current + 1) % graphics.length);
    }, AUTO_MS);
    track.addEventListener("pointerdown", pause, { passive: true });
    track.addEventListener("touchstart", pause, { passive: true });
    track.addEventListener("wheel", pause, { passive: true });
    return () => {
      clearInterval(timer);
      observer.disconnect();
      track.removeEventListener("pointerdown", pause);
      track.removeEventListener("touchstart", pause);
      track.removeEventListener("wheel", pause);
    };
  }, [graphics.length]);

  function open(i: number, trigger: HTMLElement) {
    triggerRef.current = trigger;
    openRef.current = true;
    setOpenIndex(i);
  }

  return (
    <>
      <div className="gfx-row" ref={trackRef}>
        {graphics.map((graphic, i) => (
          <button
            type="button"
            className="gfx-card"
            key={graphic.slug}
            aria-label={graphic.title}
            onClick={(e) => open(i, e.currentTarget)}
          >
            {now !== null && now - Date.parse(graphic.date) < NEW_FOR_MS && (
              <span className="gfx-new">އާ</span>
            )}
            <ArticleImage slug={graphic.slug} alt="" className="gfx" />
          </button>
        ))}
      </div>

      {graphics.length > 1 && (
        <div className="wrap dots">
          {graphics.map((graphic, i) => (
            <button
              key={graphic.slug}
              type="button"
              aria-label={`${i + 1} / ${graphics.length}`}
              aria-current={i === active}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}

      {openIndex !== null && (
        <Lightbox
          photos={graphics.map((g) => g.slug)}
          title="ގުރެފިކްސް"
          titles={graphics.map((g) => g.title)}
          startIndex={openIndex}
          ratio={GRAPHIC_RATIO}
          saveable
          onClose={() => {
            openRef.current = false;
            setOpenIndex(null);
            triggerRef.current?.focus();
          }}
        />
      )}
    </>
  );
}
