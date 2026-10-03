"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Article } from "@/lib/articles";
import CardGrid from "./CardGrid";
import StoryCard from "./StoryCard";

type Entry = { article: Article; text: string };

// Every word typed must appear somewhere in the title, summary or category.
function matches(entries: Entry[], words: string[]): Article[] {
  if (words.length === 0) return [];
  return entries
    .filter((e) => {
      const hay = e.text.toLowerCase();
      return words.every((w) => hay.includes(w));
    })
    .map((e) => e.article);
}

export default function SearchResults({
  news,
  stories,
}: {
  news: Entry[];
  stories: Entry[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  const words = useMemo(
    () => query.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [query],
  );
  const foundNews = useMemo(() => matches(news, words), [news, words]);
  const foundStories = useMemo(() => matches(stories, words), [stories, words]);
  const total = foundNews.length + foundStories.length;

  function update(value: string) {
    setQuery(value);
    // Keep the address in step so the results can be shared or reloaded.
    const q = value.trim();
    router.replace(q ? `/search/?q=${encodeURIComponent(q)}` : "/search/", {
      scroll: false,
    });
  }

  return (
    <div className="wrap cat-page search-page">
      <div className="page-head">
        <Link className="back" href="/" aria-label="ފަހަތަށް">
          <svg
            width="14"
            height="26"
            viewBox="0 0 13 26"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 1l11 12L1 25" />
          </svg>
        </Link>
        <h1 className="page-title">ހޯދުން</h1>
      </div>

      <form
        className="page-search"
        role="search"
        onSubmit={(e) => e.preventDefault()}
      >
        <label htmlFor="sq">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            id="sq"
            type="search"
            enterKeyHint="search"
            placeholder="ހޯދަން ބޭނުންވާ އެއްޗެއް ލިޔެލާ....."
            value={query}
            onChange={(e) => update(e.target.value)}
            autoFocus={!query}
          />
        </label>
      </form>

      {words.length === 0 ? (
        <p className="search-note">
          ޚަބަރެއް ނުވަތަ ވާހަކައެއް ހޯދުމަށް ލިޔުއްވާ
        </p>
      ) : total === 0 ? (
        <p className="search-note">
          &quot;{query.trim()}&quot; އާ ގުޅޭ އެއްވެސް ލިޔުމެއް ނުފެނުނު
        </p>
      ) : (
        <>
          <p className="search-note">
            <span className="num">{total}</span> ނަތީޖާ
          </p>
          {foundNews.length > 0 && (
            <CardGrid key={query} articles={foundNews} />
          )}
          {foundStories.length > 0 && (
            <>
              <h2 className="search-sub">ވާހަކަ</h2>
              <div className="cat-grid">
                {foundStories.map((s) => (
                  <StoryCard key={s.slug} article={s} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
