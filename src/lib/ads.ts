import cmsData from "@/content/cms.json";
import type { Ad, AdPlace } from "./adPlaces";

export * from "./adPlaces";

// Adverts, managed in the newsroom under Ads. Each one has a wide banner (and maybe a
// square picture for inside articles), a link, the places it shows and its dates.
// The site is rebuilt only when content changes, so the page itself checks the dates:
// an advert appears and disappears on time without a rebuild.

// Adverts for one place that haven't ended by the time the site was built.
export function getAds(place: AdPlace): Ad[] {
  return ((cmsData as unknown as { ads?: Ad[] }).ads ?? []).filter((a) => a.places.includes(place));
}
