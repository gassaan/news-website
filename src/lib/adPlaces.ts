// Advert places, types and status: shared by the site and the newsroom (no content
// imports here, so the newsroom doesn't load the site's content files).

export type AdPlace = "home" | "article-top" | "article-in" | "article-end" | "category" | "other";
export const AD_PLACES: { title: string; value: AdPlace }[] = [
  { title: "Home page", value: "home" },
  { title: "Top of articles", value: "article-top" },
  { title: "Inside articles", value: "article-in" },
  { title: "End of articles", value: "article-end" },
  { title: "Category pages", value: "category" },
  { title: "Other pages", value: "other" },
];

export type AdPicture = { src: string; w: number; h: number };
export type Ad = { id: string; name: string; link?: string; places: AdPlace[]; start?: string; end?: string; wide?: AdPicture; square?: AdPicture };

export type AdStatus = "draft" | "paused" | "soon" | "running" | "ended";
export function adStatus(a: { start?: string; end?: string; paused?: boolean }, now: number, published = true): AdStatus {
  if (!published) return "draft";
  if (a.paused) return "paused";
  if (a.start && Date.parse(a.start) > now) return "soon";
  if (a.end && Date.parse(a.end) <= now) return "ended";
  return "running";
}
