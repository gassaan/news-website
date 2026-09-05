"use client";

import { useEffect, useState } from "react";

const BASELINE_WEIGHT = 20;

function ratingKey(slug: string, episode: number) {
  return `vaahaka-rating:${slug}:${episode}`;
}

function readUserRatings(slug: string, episodeCount: number): number[] {
  const ratings: number[] = [];
  for (let episode = 1; episode <= episodeCount; episode++) {
    try {
      const raw = window.localStorage.getItem(ratingKey(slug, episode));
      const value = raw ? Number(raw) : NaN;
      if (Number.isFinite(value) && value >= 1 && value <= 5) {
        ratings.push(value);
      }
    } catch {
      // localStorage unavailable; skip
    }
  }
  return ratings;
}

export default function StoryRatingBadge({
  slug,
  baseline,
  episodeCount,
}: {
  slug: string;
  baseline: number;
  episodeCount: number;
}) {
  const [rating, setRating] = useState(baseline);
  const [voteCount, setVoteCount] = useState(0);

  useEffect(() => {
    const userRatings = readUserRatings(slug, episodeCount);
    const total = baseline * BASELINE_WEIGHT + userRatings.reduce((a, b) => a + b, 0);
    setRating(total / (BASELINE_WEIGHT + userRatings.length));
    setVoteCount(userRatings.length);
  }, [slug, baseline, episodeCount]);

  return (
    <div className="flex items-center justify-center gap-1.5">
      <svg viewBox="0 0 24 24" fill="#eab308" className="h-4 w-4">
        <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.6l-5.9 3 1.3-6.6-4.9-4.6 6.6-.8Z" />
      </svg>
      <span className="text-foreground text-sm font-semibold">
        {rating.toFixed(1)}
      </span>
      {voteCount > 0 && (
        <span className="text-muted text-xs">({voteCount} ރޭޓިންގ)</span>
      )}
    </div>
  );
}
