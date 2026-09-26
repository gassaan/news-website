import dhuniye from "@/assets/categories/dhuniye.jpg";
import kulhivaru from "@/assets/categories/kulhivaru.jpg";
import siyaasee from "@/assets/categories/siyaasee.jpg";
import viyafaari from "@/assets/categories/viyafaari.jpg";

const IMAGES: Record<string, string> = {
  siyaasee: siyaasee.src,
  viyafaari: viyafaari.src,
  kulhivaru: kulhivaru.src,
  dhuniye: dhuniye.src,
};

export function getCategoryImage(slug: string): string | undefined {
  return IMAGES[slug];
}
