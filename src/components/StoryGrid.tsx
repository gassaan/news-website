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
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="bg-background border-accent-soft/60 text-foreground hover:bg-accent-soft/20 flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            <span>+</span>
            <span>އިތުރު ވާހަކަ</span>
          </button>
        </div>
      )}
    </div>
  );
}
