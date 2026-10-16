"use client";

import { useSyncExternalStore } from "react";
import { storyRating, subscribeUserRatings } from "@/lib/storyRating";

export default function StoryRatingBadge({
  slug,
  episodeCount,
}: {
  slug: string;
  episodeCount: number;
}) {
  const rating = useSyncExternalStore(
    subscribeUserRatings,
    () => storyRating(slug, episodeCount),
    () => storyRating(slug, episodeCount, false),
  );
  // Not rated by anyone yet: no star.
  if (rating === null) return null;

  return (
    <div className="stat story-rating">
      <svg viewBox="0 0 24 24" fill="#eab308" className="h-4 w-4">
        <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.6l-5.9 3 1.3-6.6-4.9-4.6 6.6-.8Z" />
      </svg>
      <span className="num">{rating.toFixed(1)}</span>
    </div>
  );
}
