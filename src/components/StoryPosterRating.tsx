"use client";

import { useSyncExternalStore } from "react";
import {
  getBaselineAverage,
  getEffectiveEpisodeRatings,
  subscribeUserRatings,
} from "@/lib/storyRating";

function averageRating(slug: string, episodeCount: number): number {
  const effective = getEffectiveEpisodeRatings(slug, episodeCount);
  return effective.reduce((a, b) => a + b, 0) / effective.length;
}

export default function StoryPosterRating({
  slug,
  episodeCount,
}: {
  slug: string;
  episodeCount: number;
}) {
  const rating = useSyncExternalStore(
    subscribeUserRatings,
    () => averageRating(slug, episodeCount),
    () => getBaselineAverage(slug, episodeCount),
  );

  return (
    <span className="rating" dir="ltr">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="#eab308">
        <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.6l-5.9 3 1.3-6.6-4.9-4.6 6.6-.8Z" />
      </svg>
      {rating.toFixed(1)}
    </span>
  );
}
