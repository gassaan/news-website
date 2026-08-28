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
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="bg-accent-soft/40 text-accent hover:bg-accent-soft/60 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
          >
            އިތުރު ލިޔުން
          </button>
        </div>
      )}
    </div>
  );
}
