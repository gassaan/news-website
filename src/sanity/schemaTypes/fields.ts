import { defineField } from "sanity";

// Category list mirrors the site's fixed categories (src/lib/articles.ts).
export const CATEGORY_OPTIONS = [
  { title: "ސިޔާސީ", value: "siyaasee" },
  { title: "ވިޔަފާރި", value: "viyafaari" },
  { title: "ކުޅިވަރު", value: "kulhivaru" },
  { title: "ދުނިޔެ", value: "dhuniye" },
  { title: "ދިރިއުޅުން", value: "life" },
  { title: "ރިޕޯޓު", value: "report" },
];

export const titleField = (title = "ސުރުޚީ") =>
  defineField({ name: "title", title, type: "string", validation: (r) => r.required() });

// Web address part, filled from the title with one click ("Generate").
export const slugField = () =>
  defineField({
    name: "slug",
    title: "ލިންކް (Slug)",
    type: "slug",
    description: "ސައިޓުގެ ލިންކުގައި ބޭނުންކުރާ އިނގިރޭސި ނަން. މިސާލު: majlis-vote-2026",
    options: { source: "title", maxLength: 80 },
    validation: (r) => r.required(),
  });

// Publish date and time; defaults to now. Shown on the site in Maldives time.
export const dateTimeField = (name = "publishedAt", title = "ތާރީޚާއި ގަޑި") =>
  defineField({
    name,
    title,
    type: "datetime",
    initialValue: () => new Date().toISOString(),
    options: { timeStep: 5 },
    validation: (r) => r.required(),
  });

export const dateField = (name = "publishedAt", title = "ތާރީޚް") =>
  defineField({
    name,
    title,
    type: "date",
    initialValue: () => new Date().toISOString().slice(0, 10),
    validation: (r) => r.required(),
  });

export const photoField = (name = "image", title = "ފޮޓޯ", required = false) =>
  defineField({
    name,
    title,
    type: "image",
    description: "ފޮޓޯ އަޕްލޯޑް ކުރުމަށްފަހު، މުހިންމު ބައި ބާއްވަން ބޭނުންވާ ތަނަށް ތިކި ޖައްސަވާ.",
    options: { hotspot: true },
    validation: required ? (r) => r.required() : undefined,
  });

// Plain text box: one line (Enter) = one paragraph on the site.
export const bodyField = (name = "body", title = "ލިޔުން") =>
  defineField({
    name,
    title,
    type: "text",
    rows: 16,
    description: "ކޮންމެ ޕެރެގްރާފަކަށްފަހު Enter ފިއްތަވާ.",
    validation: (r) => r.required(),
  });

const DHIVEHI_MONTHS = [
  "ޖެނުއަރީ", "ފެބްރުއަރީ", "މާރިޗު", "އޭޕްރީލް", "މޭ", "ޖޫން",
  "ޖުލައި", "އޯގަސްޓް", "ސެޕްޓެމްބަރު", "އޮކްޓޯބަރު", "ނޮވެމްބަރު", "ޑިސެމްބަރު",
];

// List subtitle: "19 އޯގަސްޓް 2026 · 20:14" in Maldives time (UTC+5). Date-only values show no time.
export function formatWhen(value?: string): string {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return `${d} ${DHIVEHI_MONTHS[m - 1]} ${y}`;
  }
  const mv = new Date(new Date(value).getTime() + 5 * 60 * 60 * 1000).toISOString();
  const [y, m, d] = mv.slice(0, 10).split("-").map(Number);
  return `${d} ${DHIVEHI_MONTHS[m - 1]} ${y} · ${mv.slice(11, 16)}`;
}
