"use client";

import { useSyncExternalStore } from "react";
import { episodeBaseline, getUserRating, subscribeUserRatings } from "@/lib/storyRating";

export default function EpisodeRatingLabel({
  slug,
  episode,
}: {
  slug: string;
  episode: number;
}) {
  const userRating = useSyncExternalStore(
    subscribeUserRatings,
    () => getUserRating(slug, episode),
    () => null,
  );
  const rating = userRating ?? episodeBaseline(slug, episode);

  return (
    <span className="text-accent flex items-center gap-1 text-xs font-medium">
      <svg viewBox="0 0 24 24" fill="#eab308" className="h-3.5 w-3.5">
        <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.6l-5.9 3 1.3-6.6-4.9-4.6 6.6-.8Z" />
      </svg>
      {rating.toFixed(1)}
      {userRating !== null && <span className="text-accent">•</span>}
    </span>
  );
}
