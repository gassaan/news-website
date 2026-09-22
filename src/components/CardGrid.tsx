"use client";

import { useState, useSyncExternalStore } from "react";
import { Article } from "@/lib/articles";
import Card from "./Card";

const STEP = 6;
const MOBILE_INITIAL = 8;
const DESKTOP_INITIAL = 9;
const DESKTOP_QUERY = "(min-width: 981px)";

function subscribeIsDesktop(callback: () => void): () => void {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getIsDesktop(): boolean {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

function getServerIsDesktop(): boolean {
  return false;
}

export default function CardGrid({ articles }: { articles: Article[] }) {
  const isDesktop = useSyncExternalStore(subscribeIsDesktop, getIsDesktop, getServerIsDesktop);
  const [extra, setExtra] = useState(0);

  const base = isDesktop ? DESKTOP_INITIAL : MOBILE_INITIAL;
  const shown = Math.min(base + extra, articles.length);
  const hasMore = shown < articles.length;

  return (
    <>
      <div className="cat-grid">
        {articles.slice(0, shown).map((article) => (
          <Card key={article.slug} article={article} />
        ))}
      </div>
      {hasMore && (
        <div className="load-wrap">
          <button
            type="button"
            className="more load-more"
            onClick={() => setExtra((e) => e + STEP)}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M6.5 1v11M1 6.5h11" />
            </svg>
            އިތުރު ލިޔުން
          </button>
        </div>
      )}
    </>
  );
}
