"use client";

import { useEffect, useRef, useState } from "react";
import ArticleImage from "./ArticleImage";
import Lightbox from "./Lightbox";
import { GRAPHIC_RATIO, Graphic } from "@/lib/articles";

const AUTO_MS = 3000;
// After a touch, the next one comes this long after the finger lifts.
const RESUME_MS = 5000;
const FLY_MS = 1000;
// How far a card must be dragged before it counts as a swipe.
const SWIPE_PX = 60;
const NEW_FOR_MS = 2 * 24 * 60 * 60 * 1000;

// The graphics sit in a small pile: the top one slides away to show the next.
export default function GraphicsSwipe({ graphics }: { graphics: Graphic[] }) {
  const n = graphics.length;
  const stackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const [leaving, setLeaving] = useState<{ index: number; dir: 1 | -1 } | null>(
    null,
  );
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  // Restarts the countdown to the next graphic; set up by the autoplay effect.
  const restartRef = useRef<(ms: number) => void>(() => {});
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const openRef = useRef(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [now, setNow] = useState<number | null>(null);

  function show(i: number) {
    activeRef.current = (i + n) % n;
    setActive(activeRef.current);
  }

  // The top card flies off (right by default) and the next one rises.
  function next(dir: 1 | -1 = 1) {
    const from = activeRef.current;
    setLeaving({ index: from, dir });
    show(from + 1);
    setTimeout(() => setLeaving((l) => (l?.index === from ? null : l)), FLY_MS);
  }

  // The "new" badge depends on today's date, so it is only worked out in the browser.
  useEffect(() => {
    const id = requestAnimationFrame(() => setNow(Date.now()));
    return () => cancelAnimationFrame(id);
  }, []);

  // Moves on every few seconds, only while on screen and nobody is touching it.
  useEffect(() => {
    const stack = stackRef.current;
    if (!stack || n < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let visible = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.5 },
    );
    observer.observe(stack);
    let timer: ReturnType<typeof setTimeout> | undefined;
    function restart(ms: number) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (visible && !openRef.current && !document.hidden) next(1);
        restart(AUTO_MS);
      }, ms);
    }
    restartRef.current = restart;
    restart(AUTO_MS);
    return () => {
      clearTimeout(timer);
      restartRef.current = () => {};
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  function onPointerDown(e: React.PointerEvent) {
    restartRef.current(RESUME_MS);
    // A new touch starts fresh: the click after a drag may land outside the card.
    suppressClick.current = false;
    dragRef.current = { x: e.clientX, y: e.clientY, moved: false };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved) {
      // Up/down movement is a page scroll, not a swipe.
      if (
        Math.abs(e.clientY - d.y) > Math.abs(dx) &&
        Math.abs(e.clientY - d.y) > 8
      ) {
        dragRef.current = null;
        return;
      }
      if (Math.abs(dx) < 8) return;
      d.moved = true;
      setDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    }
    setDragX(dx);
  }
  function onPointerUp() {
    restartRef.current(RESUME_MS);
    const d = dragRef.current;
    dragRef.current = null;
    if (!d?.moved) return;
    suppressClick.current = true;
    setDragging(false);
    // Swipe right: next one. Swipe left: back to the one before.
    if (dragX > SWIPE_PX) next(1);
    else if (dragX < -SWIPE_PX) show(activeRef.current - 1);
    setDragX(0);
  }

  function open(i: number, trigger: HTMLElement) {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    triggerRef.current = trigger;
    openRef.current = true;
    setOpenIndex(i);
  }

  function cardStyle(i: number): React.CSSProperties {
    if (leaving?.index === i) {
      return {
        zIndex: 200,
        opacity: 0,
        transform: `translateX(${leaving.dir * 115}%) rotate(${leaving.dir * 10}deg)`,
      };
    }
    const k = (i - active + n) % n;
    if (k === 0) {
      return {
        zIndex: 100,
        transform: `translateX(${dragX}px) rotate(${dragX / 25}deg)`,
        transition: dragging ? "none" : undefined,
      };
    }
    if (k < 3) {
      return {
        zIndex: 100 - k,
        opacity: 1 - k * 0.25,
        transform: `translateX(${-k * 16}px) translateY(${k * 10}px) scale(${1 - k * 0.06}) rotate(${-k * 3}deg)`,
      };
    }
    return {
      zIndex: 0,
      opacity: 0,
      transform: "translateX(-40px) scale(0.8)",
      pointerEvents: "none",
    };
  }

  return (
    <>
      <div
        className="gfx-stack"
        ref={stackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {graphics.map((graphic, i) => {
          const top = i === active;
          return (
            <button
              type="button"
              className="gfx-card"
              key={graphic.slug}
              style={cardStyle(i)}
              aria-label={graphic.title}
              aria-hidden={!top}
              tabIndex={top ? 0 : -1}
              onClick={(e) => open(i, e.currentTarget)}
            >
              {now !== null && now - Date.parse(graphic.date) < NEW_FOR_MS && (
                <span className="gfx-new">އާ</span>
              )}
              <ArticleImage slug={graphic.slug} alt="" className="gfx" />
            </button>
          );
        })}
      </div>

      {n > 1 && (
        <div className="wrap dots">
          {graphics.map((graphic, i) => (
            <button
              key={graphic.slug}
              type="button"
              aria-label={`${i + 1} / ${n}`}
              aria-current={i === active}
              onClick={() => {
                restartRef.current(RESUME_MS);
                show(i);
              }}
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
