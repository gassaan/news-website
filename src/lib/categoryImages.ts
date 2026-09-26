import siyaasee from "@/assets/categories/siyaasee.jpg";

const IMAGES: Record<string, string> = {
  siyaasee: siyaasee.src,
};

export function getCategoryImage(slug: string): string | undefined {
  return IMAGES[slug];
}
