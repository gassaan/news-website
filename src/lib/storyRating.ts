import { pseudoRating } from "./articles";

export function ratingKey(slug: string, episode: number): string {
  return `vaahaka-rating:${slug}:${episode}`;
}

export function episodeBaseline(slug: string, episode: number): number {
  return Number(pseudoRating(`${slug}:${episode}`));
}

export function getUserRating(slug: string, episode: number): number | null {
  try {
    const raw = window.localStorage.getItem(ratingKey(slug, episode));
    const value = raw ? Number(raw) : NaN;
    return Number.isFinite(value) && value >= 1 && value <= 5 ? value : null;
  } catch {
    return null;
  }
}

export function setUserRating(slug: string, episode: number, value: number): void {
  try {
    window.localStorage.setItem(ratingKey(slug, episode), String(value));
  } catch {
    // localStorage unavailable; rating still reflected for this view
  }
}

/** Each episode's current rating: the reader's own rating if given, else its baseline. */
export function getEffectiveEpisodeRatings(
  slug: string,
  episodeCount: number,
): number[] {
  const ratings: number[] = [];
  for (let episode = 1; episode <= episodeCount; episode++) {
    ratings.push(getUserRating(slug, episode) ?? episodeBaseline(slug, episode));
  }
  return ratings;
}

/** Baseline-only average, safe to compute on the server for the first paint. */
export function getBaselineAverage(slug: string, episodeCount: number): number {
  let sum = 0;
  for (let episode = 1; episode <= episodeCount; episode++) {
    sum += episodeBaseline(slug, episode);
  }
  return sum / episodeCount;
}

export function countUserRatings(slug: string, episodeCount: number): number {
  let count = 0;
  for (let episode = 1; episode <= episodeCount; episode++) {
    if (getUserRating(slug, episode) !== null) count++;
  }
  return count;
}
