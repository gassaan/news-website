"use client";

import { useEffect, useState } from "react";
import { getUserRating, setUserRating } from "@/lib/storyRating";

export default function EpisodeRatingWidget({
  slug,
  episode,
}: {
  slug: string;
  episode: number;
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    setRating(getUserRating(slug, episode));
  }, [slug, episode]);

  function rate(value: number) {
    setRating(value);
    setUserRating(slug, episode, value);
  }

  const display = hovered ?? rating ?? 0;

  return (
    <div className="border-accent-soft/40 mt-8 flex flex-col items-center gap-2 border-t pt-6">
      <p className="text-muted text-sm">
        {rating ? "މި ބައި ރޭޓްކުރެއްވިއްޖެ، ޝުކުރިއްޔާ" : "މި ބައި ރޭޓްކުރައްވާ"}
      </p>
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => setHovered(null)}
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`${value} ތަރި ދެއްވާ`}
            onMouseEnter={() => setHovered(value)}
            onClick={() => rate(value)}
            className="p-0.5"
          >
            <svg
              viewBox="0 0 24 24"
              fill={value <= display ? "#eab308" : "none"}
              stroke={value <= display ? "#eab308" : "currentColor"}
              strokeWidth="1.5"
              className="text-muted h-7 w-7 transition-colors"
            >
              <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.6l-5.9 3 1.3-6.6-4.9-4.6 6.6-.8Z" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
