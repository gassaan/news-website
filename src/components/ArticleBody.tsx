"use client";

import { useState } from "react";

const SIZES = ["text-base", "text-lg", "text-xl", "text-2xl"];

export default function ArticleBody({
  paragraphs,
  author,
}: {
  paragraphs: string[];
  author: string;
}) {
  const [sizeIndex, setSizeIndex] = useState(1);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-foreground text-sm font-medium">
            {author}
          </span>
          <span className="border-accent-soft/50 text-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold">
            {author.charAt(0)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSizeIndex((i) => Math.max(0, i - 1))}
            disabled={sizeIndex === 0}
            aria-label="ފޮންޓް ސައިޒް ކުޑަކުރައްވާ"
            className="border-accent-soft/50 text-accent flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-accent-soft/30 disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4">
              <path d="M5 12h14" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setSizeIndex((i) => Math.min(SIZES.length - 1, i + 1))}
            disabled={sizeIndex === SIZES.length - 1}
            aria-label="ފޮންޓް ސައިޒް ބޮޑުކުރައްވާ"
            className="border-accent-soft/50 text-accent flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-accent-soft/30 disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className={`text-foreground/90 flex flex-col gap-6 leading-8 ${SIZES[sizeIndex]}`}
      >
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}
