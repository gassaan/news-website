"use client";

import { useEffect, useRef, useState } from "react";
import { Article } from "@/lib/articles";
import ArticleImage from "./ArticleImage";
import DateStamp from "./DateStamp";
import Link from "next/link";

const AUTO_MS = 6000;
// After a touch, the next story comes this long after the finger lifts.
const RESUME_MS = 8000;
const FLY_MS = 1000;
// How far a card must be dragged before it counts as a swipe.
const SWIPE_PX = 60;

// The top stories sit in a pile: the top card flies away to show the next one,
// which waits just behind it.
export default function HeroSlider({ articles }: { articles: Article[] }) {
  const n = articles.length;
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
  // Restarts the countdown to the next story; set up by the autoplay effect.
  const restartRef = useRef<(ms: number) => void>(() => {});

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
        if (visible && !document.hidden) next(1);
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
    // Swipe right: next story. Swipe left: back to the one before.
    if (dragX > SWIPE_PX) next(1);
    else if (dragX < -SWIPE_PX) show(activeRef.current - 1);
    setDragX(0);
  }
  // A drag should not also open the story under the finger.
  function onClickCapture(e: React.MouseEvent) {
    if (suppressClick.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClick.current = false;
    }
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
        transform: `translateX(${dragX}px) rotate(${dragX / 30}deg)`,
        transition: dragging ? "none" : undefined,
      };
    }
    // The next story peeks out just below the top card; the rest wait unseen behind it.
    return {
      zIndex: 100 - k,
      opacity: k === 1 ? 0.7 : 0,
      transform: "translateY(30px) scale(0.94)",
    };
  }

  return (
    <div className="wrap hero">
      <div
        className="hero-track"
        ref={stackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
      >
        {articles.map((article, i) => {
          const top = i === active;
          return (
            <article
              className="slide"
              key={article.slug}
              style={cardStyle(i)}
              aria-hidden={!top}
              inert={!top}
            >
              {/* The photo runs to the card's edges and fades into it; the big headline sits over the fade. */}
              <Link className="slide-ph" href={`/article/${article.slug}`} aria-label={article.title} tabIndex={-1} draggable={false}>
                <ArticleImage slug={article.slug} alt="" />
              </Link>
              <div className="copy">
                <h1>{article.title}</h1>
                <p>{article.excerpt}</p>
                <div className="slide-foot">
                  <DateStamp date={article.publishedAt} />
                  <Link className="hero-go" href={`/article/${article.slug}`} aria-label="ފުރިހަމައަށް ކިޔާލާ" draggable={false}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M15 6l-6 6 6 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {n > 1 && (
        <div className="dots">
          {articles.map((article, i) => (
            <button
              key={article.slug}
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
    </div>
  );
}
