import cmsData from "@/content/cms.json";

export type PolicySection = { heading: string; paragraphs: string[] };
export type Policy = { intro: string; sections: PolicySection[]; updated: string };

type CmsPolicy = {
  intro?: string | null;
  sections?: { heading?: string | null; body?: string | null }[] | null;
  _updatedAt?: string | null;
};

// Reads a policy page from the dashboard; while it has no sections the built-in text is shown.
export function readPolicy(key: "privacy" | "terms", fallback: Policy): Policy {
  const p = (cmsData as unknown as Record<string, CmsPolicy | undefined>)[key];
  const sections = (p?.sections ?? [])
    .map((s) => ({
      heading: (s.heading ?? "").trim(),
      // A blank line in the dashboard text starts a new paragraph.
      paragraphs: (s.body ?? "")
        .split(/\n\s*\n/)
        .map((t) => t.trim())
        .filter(Boolean),
    }))
    .filter((s) => s.heading || s.paragraphs.length);

  if (!sections.length) {
    return { ...fallback, intro: (p?.intro ?? "").trim() || fallback.intro };
  }
  return {
    intro: (p?.intro ?? "").trim(),
    sections,
    updated: p?._updatedAt?.slice(0, 10) ?? fallback.updated,
  };
}
