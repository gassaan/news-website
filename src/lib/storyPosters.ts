import vaahaka3 from "@/assets/stories/vaahaka-3.jpg";

const POSTERS: Record<string, string> = {
  "vaahaka-3": vaahaka3.src,
};

export function getStoryPoster(slug: string): string | undefined {
  return POSTERS[slug];
}
