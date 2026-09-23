import muhammadAli from "@/assets/authors/muhammad-ali.jpg";

const PHOTOS: Record<string, string> = {
  "khabaru-team": muhammadAli.src,
};

export function getAuthorPhoto(slug: string): string | undefined {
  return PHOTOS[slug];
}
