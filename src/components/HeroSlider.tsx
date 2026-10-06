"use client";

import { useEffect, useRef, useState } from "react";
import { Article } from "@/lib/articles";
import ArticleImage from "./ArticleImage";
import DateStamp from "./DateStamp";
import Link from "next/link";

export default function HeroSlider({ articles }: { articles: Article[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function goTo(i: number) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: -i * el.clientWidth, behavior: "smooth" });
    setActive(i);
  }

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    function onScroll() {
      if (!el) return;
      setActive(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      setActive((cur) => {
        const next = (cur + 1) % articles.length;
        trackRef.current?.scrollTo({ left: -next * trackRef.current.clientWidth, behavior: "smooth" });
        return next;
      });
    }, 6000);
    const el = trackRef.current;
    const clear = () => clearInterval(timer);
    el?.addEventListener("pointerdown", clear, { once: true });
    return () => {
      clearInterval(timer);
      el?.removeEventListener("pointerdown", clear);
    };
  }, [articles.length]);

  return (
    <div className="wrap hero">
      <div className="hero-track" ref={trackRef}>
        {articles.map((article) => (
          <article className="slide" key={article.slug}>
            {/* The photo runs to the card's edges and fades into it; the big headline sits over the fade. */}
            <Link className="slide-ph" href={`/article/${article.slug}`} aria-label={article.title} tabIndex={-1}>
              <ArticleImage slug={article.slug} alt="" />
            </Link>
            <div className="copy">
              <h1>{article.title}</h1>
              <p>{article.excerpt}</p>
              <div className="slide-foot">
                <DateStamp date={article.publishedAt} />
                <Link className="hero-go" href={`/article/${article.slug}`} aria-label="ފުރިހަމައަށް ކިޔާލާ">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="dots">
        {articles.map((article, i) => (
          <button
            key={article.slug}
            type="button"
            aria-label={`Slide ${i + 1}`}
            aria-current={i === active}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}
