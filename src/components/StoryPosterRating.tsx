"use client";

import { useEffect, useState } from "react";
import { getBaselineAverage, getEffectiveEpisodeRatings } from "@/lib/storyRating";

export default function StoryPosterRating({
  slug,
  episodeCount,
}: {
  slug: string;
  episodeCount: number;
}) {
  const [rating, setRating] = useState(() => getBaselineAverage(slug, episodeCount));

  useEffect(() => {
    const effective = getEffectiveEpisodeRatings(slug, episodeCount);
    setRating(effective.reduce((a, b) => a + b, 0) / effective.length);
  }, [slug, episodeCount]);

  return (
    <span className="bg-background/90 text-foreground absolute top-3 right-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold">
      <svg viewBox="0 0 24 24" fill="#eab308" className="h-3.5 w-3.5">
        <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.6l-5.9 3 1.3-6.6-4.9-4.6 6.6-.8Z" />
      </svg>
      {rating.toFixed(1)}
    </span>
  );
}
