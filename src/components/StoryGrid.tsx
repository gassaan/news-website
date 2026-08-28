"use client";

import { useState } from "react";
import { Article } from "@/lib/articles";
import StoryCard from "./StoryCard";

const PAGE_SIZE = 6;

export default function StoryGrid({ stories }: { stories: Article[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = stories.slice(0, visible);
  const hasMore = visible < stories.length;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {shown.map((story) => (
          <StoryCard key={story.slug} article={story} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="bg-accent-soft/40 text-accent hover:bg-accent-soft/60 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
          >
            އިތުރު ވާހަކަ
          </button>
        </div>
      )}
    </div>
  );
}
