"use client";

import { useState, useSyncExternalStore } from "react";
import { getUserRating, setUserRating, subscribeUserRatings } from "@/lib/storyRating";

// The word shown under the stars for each rating.
const LABELS = ["", "ކަމުނުދިޔަ", "އެހާ ރަނގަޅެއް ނޫން", "ރަނގަޅު", "ވަރަށް ރަނގަޅު", "މޮޅު!"];

const STAR_PATH = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.6l-5.9 3 1.3-6.6-4.9-4.6 6.6-.8Z";

export default function EpisodeRatingWidget({
  slug,
  episode,
}: {
  slug: string;
  episode: number;
}) {
  const rating = useSyncExternalStore(
    subscribeUserRatings,
    () => getUserRating(slug, episode),
    () => null,
  );
  const [hovered, setHovered] = useState<number | null>(null);
  // Bumped on every tap so the chosen star replays its pop even when the same rating is tapped again.
  const [tap, setTap] = useState(0);

  function rate(value: number) {
    setUserRating(slug, episode, value);
    setTap((t) => t + 1);
  }

  const display = hovered ?? rating ?? 0;

  return (
    <div className="ep-rate">
      <p className="ep-rate-q">{rating ? "ޝުކުރިއްޔާ! މި ބައި ރޭޓްކުރެއްވީ" : "މި ބައި ރޭޓްކުރައްވާ"}</p>
      <div className="ep-rate-stars" onMouseLeave={() => setHovered(null)}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value === rating ? `${value}-${tap}` : value}
            type="button"
            aria-label={`${value} ތަރި ދެއްވާ`}
            aria-pressed={rating === value}
            onMouseEnter={() => setHovered(value)}
            onClick={() => rate(value)}
            className={`ep-star${value <= display ? " on" : ""}${value === rating ? " chosen" : ""}`}
            style={{ "--i": value } as React.CSSProperties}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={STAR_PATH} />
            </svg>
          </button>
        ))}
      </div>
      <p className="ep-rate-label" aria-live="polite">
        {display > 0 && (
          <span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={STAR_PATH} />
            </svg>
            {LABELS[display]}
          </span>
        )}
      </p>
      {rating && <p className="ep-rate-hint">ބަދަލުކުރަން ތަރިއަށް އަލުން ފިއްތަވާ</p>}
    </div>
  );
}
