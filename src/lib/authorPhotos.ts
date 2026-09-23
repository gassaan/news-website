import fathimathAdam from "@/assets/authors/fathimath-adam.jpg";
import mariyamManike from "@/assets/authors/mariyam-manike.jpg";
import muhammadAli from "@/assets/authors/muhammad-ali.jpg";

const PHOTOS: Record<string, string> = {
  "khabaru-team": muhammadAli.src,
  "mariyam-manike": mariyamManike.src,
  "report-team": fathimathAdam.src,
};

export function getAuthorPhoto(slug: string): string | undefined {
  return PHOTOS[slug];
}
