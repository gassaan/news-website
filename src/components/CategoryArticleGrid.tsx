"use client";

import { useState } from "react";
import { Article } from "@/lib/articles";
import CategoryArticleCard from "./CategoryArticleCard";

const PAGE_SIZE = 6;

export default function CategoryArticleGrid({
  articles,
}: {
  articles: Article[];
}) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = articles.slice(0, visible);
  const hasMore = visible < articles.length;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {shown.map((article) => (
          <CategoryArticleCard key={article.slug} article={article} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="bg-background border-accent-soft/60 text-foreground hover:bg-accent-soft/20 flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            <span>+</span>
            <span>އިތުރު ލިޔުން</span>
          </button>
        </div>
      )}
    </div>
  );
}
