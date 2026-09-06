"use client";

import { useEffect, useState } from "react";
import {
  countUserRatings,
  getBaselineAverage,
  getEffectiveEpisodeRatings,
} from "@/lib/storyRating";

export default function StoryRatingBadge({
  slug,
  episodeCount,
}: {
  slug: string;
  episodeCount: number;
}) {
  const [rating, setRating] = useState(() => getBaselineAverage(slug, episodeCount));
  const [ratedCount, setRatedCount] = useState(0);

  useEffect(() => {
    const effective = getEffectiveEpisodeRatings(slug, episodeCount);
    setRating(effective.reduce((a, b) => a + b, 0) / effective.length);
    setRatedCount(countUserRatings(slug, episodeCount));
  }, [slug, episodeCount]);

  return (
    <div className="border-accent-soft/50 bg-card-accent/40 flex flex-col items-center gap-0.5 rounded-full border px-5 py-2">
      <span className="flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" fill="#eab308" className="h-4 w-4">
          <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.6l-5.9 3 1.3-6.6-4.9-4.6 6.6-.8Z" />
        </svg>
        <span className="text-foreground text-sm leading-none font-bold">
          {rating.toFixed(1)}
        </span>
      </span>
      {ratedCount > 0 && (
        <span className="text-muted text-[9px] leading-none">
          {ratedCount}/{episodeCount} ބައި ރޭޓްކުރެވިފައި
        </span>
      )}
    </div>
  );
}
