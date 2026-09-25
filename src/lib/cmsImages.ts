import images from "@/content/cms-images.json";

export type CmsImage = { src: string; pos?: string };

// Photos from the Sanity dashboard, keyed by the same slug the placeholder uses
// (article slug, story slug, "author-<slug>", "<album>-<n>", graphic slug, poll id).
export function cmsImage(key: string): CmsImage | undefined {
  return (images as Record<string, CmsImage>)[key];
}
