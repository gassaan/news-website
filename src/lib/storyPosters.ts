import { cmsImage } from "./cmsImages";
import vaahaka3 from "@/assets/stories/vaahaka-3.jpg";
import vaahaka6 from "@/assets/stories/vaahaka-6.jpg";

const POSTERS: Record<string, string> = {
  "vaahaka-3": vaahaka3.src,
  "vaahaka-6": vaahaka6.src,
};

// Where to keep the photo's subject when a wide photo is cropped to a tall frame.
const FOCUS: Record<string, string> = {
  "vaahaka-6": "84% 50%",
};

export function getStoryPoster(slug: string): string | undefined {
  return cmsImage(slug)?.src ?? POSTERS[slug];
}

export function getStoryPosterStyle(slug: string): React.CSSProperties | undefined {
  const focus = cmsImage(slug)?.pos ?? FOCUS[slug];
  return focus ? ({ "--poster-pos": focus } as React.CSSProperties) : undefined;
}

// An episode's own photo from the dashboard, or else the story poster.
export function getEpisodePhoto(slug: string, episode: number): { src?: string; style?: React.CSSProperties } {
  const own = cmsImage(`${slug}-ep-${episode}`);
  if (own) return { src: own.src, style: own.pos ? ({ "--poster-pos": own.pos } as React.CSSProperties) : undefined };
  return { src: getStoryPoster(slug), style: getStoryPosterStyle(slug) };
}
