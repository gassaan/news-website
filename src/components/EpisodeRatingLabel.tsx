"use client";

import { useEffect, useState } from "react";
import { episodeBaseline, getUserRating } from "@/lib/storyRating";

export default function EpisodeRatingLabel({
  slug,
  episode,
}: {
  slug: string;
  episode: number;
}) {
  const [rating, setRating] = useState(() => episodeBaseline(slug, episode));
  const [isUserRated, setIsUserRated] = useState(false);

  useEffect(() => {
    const userRating = getUserRating(slug, episode);
    setRating(userRating ?? episodeBaseline(slug, episode));
    setIsUserRated(userRating !== null);
  }, [slug, episode]);

  return (
    <span className="text-muted flex items-center gap-1 text-xs">
      <svg viewBox="0 0 24 24" fill="#eab308" className="h-3.5 w-3.5">
        <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.6l-5.9 3 1.3-6.6-4.9-4.6 6.6-.8Z" />
      </svg>
      {rating.toFixed(1)}
      {isUserRated && <span className="text-accent">•</span>}
    </span>
  );
}
