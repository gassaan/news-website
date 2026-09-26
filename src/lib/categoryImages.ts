import siyaasee from "@/assets/categories/siyaasee.jpg";
import viyafaari from "@/assets/categories/viyafaari.jpg";

const IMAGES: Record<string, string> = {
  siyaasee: siyaasee.src,
  viyafaari: viyafaari.src,
};

export function getCategoryImage(slug: string): string | undefined {
  return IMAGES[slug];
}
