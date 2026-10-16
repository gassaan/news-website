import { builtRatings, pseudoRating } from "./articles";
import { apiGet, apiOn, apiPost, voterId } from "./api";

// Story episode ratings. With the online service on, they are everyone's ratings:
// numbers from the last build first, then fresh from the service. Without it the
// site shows its earlier sample ratings plus the reader's own.

export function ratingKey(slug: string, episode: number): string {
  return `vaahaka-rating:${slug}:${episode}`;
}

type Listener = () => void;
type Counts = Record<string, Record<string, { avg: number; n: number }>>;
const listeners = new Set<Listener>();
let live: Counts = builtRatings();
let fetched = false;

async function refresh(bust = false): Promise<void> {
  const got = await apiGet<Counts>(`/ratings${bust ? `?t=${Date.now()}` : ""}`);
  if (got) {
    live = got;
    listeners.forEach((listener) => listener());
  }
}

export function subscribeUserRatings(listener: Listener): () => void {
  listeners.add(listener);
  if (apiOn && !fetched) {
    fetched = true;
    void refresh();
  }
  return () => listeners.delete(listener);
}

function notifyUserRatingsChanged(): void {
  listeners.forEach((listener) => listener());
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
  notifyUserRatingsChanged();
  if (apiOn) {
    void apiPost("/rate", { story: slug, episode, value, voter: voterId() }).then(() => refresh(true));
  }
}

// One episode's rating to show, or null while nobody has rated it.
export function episodeRating(slug: string, episode: number, withOwn = true): number | null {
  if (apiOn) return live[slug]?.[episode]?.avg ?? null;
  return (withOwn ? getUserRating(slug, episode) : null) ?? episodeBaseline(slug, episode);
}

// A whole story's rating to show, or null while nobody has rated it.
export function storyRating(slug: string, episodeCount: number, withOwn = true): number | null {
  if (apiOn) {
    let sum = 0;
    let n = 0;
    for (const r of Object.values(live[slug] ?? {})) {
      sum += r.avg * r.n;
      n += r.n;
    }
    return n ? Math.round((sum / n) * 10) / 10 : null;
  }
  let sum = 0;
  for (let episode = 1; episode <= episodeCount; episode++) {
    sum += episodeRating(slug, episode, withOwn) ?? 0;
  }
  return sum / episodeCount;
}
