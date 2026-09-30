"use client";

import { useEffect, useRef, useState } from "react";
import { Article } from "@/lib/articles";
import ArticleImage from "./ArticleImage";
import { cmsImage } from "@/lib/cmsImages";
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
        {articles.map((article) => {
          const photo = cmsImage(article.slug);
          return (
            <article className="slide" key={article.slug}>
              {/* The story's own photo, blurred, colours the card behind the text. */}
              {photo && <div className="slide-ambient" aria-hidden="true" style={{ backgroundImage: `url("${photo.src}")` }} />}
              <div className="copy">
                <h1>{article.title}</h1>
                <p>{article.excerpt}</p>
                <Link className="more hero-more" href={`/article/${article.slug}`}>
                  ފުރިހަމައަށް ކިޔާލާ <span aria-hidden="true">›</span>
                </Link>
              </div>
              <Link href={`/article/${article.slug}`} aria-label={article.title} tabIndex={-1}>
                <ArticleImage slug={article.slug} alt="" />
              </Link>
            </article>
          );
        })}
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
