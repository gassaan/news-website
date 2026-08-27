"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Article, getCategory } from "@/lib/articles";
import NewsIllustration from "./NewsIllustration";

export default function HeroCarousel({ articles }: { articles: Article[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || articles.length < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % articles.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [paused, articles.length]);

  if (articles.length === 0) return null;

  const article = articles[index];
  const category = getCategory(article.category);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="border-accent-soft/50 bg-card-accent/40 hover:border-accent/60 mx-auto flex w-full max-w-xl min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border p-4 transition-colors sm:p-5"
    >
      <Link
        href={`/article/${article.slug}`}
        key={article.slug}
        className="animate-fade-in group block"
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
