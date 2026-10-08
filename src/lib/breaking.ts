import cmsData from "@/content/cms.json";

export type BreakingNews = { headline: string; slug?: string };

// Switched on and off in the dashboard under "އަވަސް ޚަބަރު"; null while off.
export function getBreakingNews(): BreakingNews | null {
  return (cmsData as unknown as { breaking?: BreakingNews }).breaking ?? null;
}
