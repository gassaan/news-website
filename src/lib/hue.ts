// Deterministic hue (0-359) used to seed the .ph gradient placeholder for a
// given slug, so the same item always gets the same placeholder colour.
export function pseudoHue(slug: string): number {
  let hash = 0;
  for (const char of slug) {
    hash = (hash * 53 + char.charCodeAt(0)) % 100000;
  }
  return hash % 360;
}
