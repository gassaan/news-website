// Advert places, types and status: shared by the site and the newsroom (no content
// imports here, so the newsroom doesn't load the site's content files).

export type AdPlace = "home" | "article-top" | "article-in" | "article-end" | "category" | "other" | "story-break";
export const AD_PLACES: { title: string; value: AdPlace }[] = [
  { title: "Home page", value: "home" },
  { title: "Top of articles", value: "article-top" },
  { title: "Inside articles", value: "article-in" },
  { title: "End of articles", value: "article-end" },
  { title: "Category pages", value: "category" },
  { title: "Other pages", value: "other" },
  // A full-screen advert for 5 seconds when a reader goes to a story's next episode.
  { title: "Between story episodes", value: "story-break" },
];

// How often an advert shows when several share a space: its share is its weight
// divided by the weights of all the running adverts there.
export type AdWeight = "less" | "normal" | "more" | "most";
export const AD_WEIGHTS: { title: string; value: AdWeight; n: number }[] = [
  { title: "Less", value: "less", n: 0.5 },
  { title: "Normal", value: "normal", n: 1 },
  { title: "More", value: "more", n: 2 },
  { title: "Most", value: "most", n: 3 },
];
export const weightOf = (w?: string) => AD_WEIGHTS.find((x) => x.value === w)?.n ?? 1;

// One advert out of several, more often the heavier ones (random: a number from 0 to 1).
export function pickAd<T extends { weight?: string }>(ads: T[], random: number): T | null {
  const total = ads.reduce((n, a) => n + weightOf(a.weight), 0);
  let left = random * total;
  for (const a of ads) {
    left -= weightOf(a.weight);
    if (left < 0) return a;
  }
  return ads[ads.length - 1] ?? null;
}

export type AdPicture = { src: string; w: number; h: number };
export type Ad = { id: string; name: string; link?: string; places: AdPlace[]; start?: string; end?: string; weight?: AdWeight; wide?: AdPicture; square?: AdPicture };

export type AdStatus = "draft" | "paused" | "soon" | "running" | "ended";
export function adStatus(a: { start?: string; end?: string; paused?: boolean }, now: number, published = true): AdStatus {
  if (!published) return "draft";
  if (a.paused) return "paused";
  if (a.start && Date.parse(a.start) > now) return "soon";
  if (a.end && Date.parse(a.end) <= now) return "ended";
  return "running";
}
