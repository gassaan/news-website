import speakingurl from "speakingurl";

// Web address part, filled from the title with one tap ("From title").
// Only a-z, 0-9 and "-" are allowed: a "/" would point to a page that doesn't exist.
// Thaana titles are spelled out in Latin letters first (as Sanity does by default).
export const toSlug = (input: string) =>
  speakingurl(input, { truncate: 80, symbols: true })
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
