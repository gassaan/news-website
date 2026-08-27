"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Article, getCategory } from "@/lib/articles";
import NewsIllustration from "./NewsIllustration";

function Slide({ article }: { article: Article }) {
  const category = getCategory(article.category);

  return (
    <Link
      href={`/article/${article.slug}`}
      dir="rtl"
      className="group block h-full w-full"
    >
      <NewsIllustration category={article.category} />
      <div className="mt-6">
        {category && (
          <span className="bg-accent-soft/40 text-accent inline-block w-fit rounded-full px-2.5 py-1 text-xs font-semibold">
            {category.name}
          </span>
        )}
        <h1 className="font-democrats-ak text-foreground mt-3 line-clamp-2 text-3xl leading-relaxed group-hover:underline sm:text-4xl">
          {article.title}
        </h1>
        <p className="text-muted mt-3 line-clamp-3 text-sm leading-6">
          {article.excerpt}
        </p>
      </div>
    </Link>
  );
}

export default function HeroCarousel({ articles }: { articles: Article[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [entered, setEntered] = useState(true);
  const prevIndexRef = useRef(0);

  useEffect(() => {
    if (paused || articles.length < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % articles.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [paused, articles.length]);

  useEffect(() => {
    if (prevIndexRef.current === index) return;
    setOutgoing(prevIndexRef.current);
    setEntered(false);
    prevIndexRef.current = index;

    const raf = requestAnimationFrame(() => setEntered(true));
    const timeout = setTimeout(() => setOutgoing(null), 700);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [index]);

  if (articles.length === 0) return null;

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="border-accent-soft/50 bg-card-accent/40 hover:border-accent/60 mx-auto flex w-full max-w-xl min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border p-4 transition-colors sm:p-5"
    >
      <div dir="ltr" className="relative min-h-0 flex-1 overflow-hidden">
        {outgoing !== null && (
          <div
            className="absolute inset-0 transition-transform duration-700 ease-in-out"
            style={{ transform: entered ? "translateX(100%)" : "translateX(0%)" }}
          >
            <Slide article={articles[outgoing]} />
          </div>
        )}
        <div
          className="absolute inset-0 transition-transform duration-700 ease-in-out"
          style={{
            transform:
              outgoing === null
                ? "translateX(0%)"
                : entered
                  ? "translateX(0%)"
                  : "translateX(-100%)",
          }}
        >
          <Slide article={articles[index]} />
        </div>
      </div>

      {articles.length > 1 && (
        <div className="mt-auto flex items-center justify-center gap-2 pt-6">
          {articles.map((a, i) => (
            <button
              key={a.slug}
              type="button"
              aria-label={`${i + 1} ވަނަ ޚަބަރު`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "bg-accent w-6" : "bg-accent-soft w-2"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
