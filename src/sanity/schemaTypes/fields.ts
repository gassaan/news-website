import { defineField } from "sanity";
import { toSlug } from "../slug";
import { BodyInput, DateTimeInput, SlugInput } from "../editor/inputs";

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

// Web address part, filled from the title with one click ("From title").
export const slugField = () =>
  defineField({
    name: "slug",
    title: "ލިންކް (Slug)",
    type: "slug",
    description: "ސައިޓުގެ ލިންކުގައި ބޭނުންކުރާ އިނގިރޭސި ނަން. އިނގިރޭސި އަކުރު، ނަމްބަރު އަދި - އެކަނި. މިސާލު: majlis-vote-2026",
    options: { source: "title", maxLength: 80, slugify: toSlug },
    components: { input: SlugInput },
    validation: (r) =>
      r.required().custom((value?: { current?: string }) => {
        const current = value?.current ?? "";
        return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(current)
          ? true
          : "އިނގިރޭސި ކުދި އަކުރު، ނަމްބަރު އަދި - އެކަނި ބޭނުންކުރައްވާ (/ ނުވަތަ ހުސްޖާގަ ނުލާ). މިސާލު: report-1000";
      }),
  });

export const dateTimeField = (name = "publishedAt", title = "ތާރީޚާއި ގަޑި") =>
  defineField({
    name,
    title,
    // A later time schedules the item: the site leaves it out until then.
    description: "ކުރިއަށް އޮތް ގަޑިއެއް ލިޔުއްވައިފިނަމަ، ވެބްސައިޓުގައި ފެންނާނީ އެ ގަޑި ޖެހުމުން (10-20 މިނިޓު ތެރޭގައި).",
    type: "datetime",
    initialValue: () => new Date().toISOString(),
    options: { timeStep: 5 },
    components: { input: DateTimeInput },
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
    components: { input: BodyInput },
    validation: (r) => r.required(),
  });

const DHIVEHI_MONTHS = [
  "ޖެނުއަރީ", "ފެބްރުއަރީ", "މާރިޗު", "އޭޕްރީލް", "މޭ", "ޖޫން",
  "ޖުލައި", "އޯގަސްޓް", "ސެޕްޓެމްބަރު", "އޮކްޓޯބަރު", "ނޮވެމްބަރު", "ޑިސެމްބަރު",
];

// List subtitle: "19 އޯގަސްޓް 2026 · 20:14" in Maldives time (UTC+5). Date-only values show no time.
// Like formatWhen, but marks items set to go live later with a clock.
export function formatPublish(value?: string): string {
  const when = formatWhen(value);
  return value && new Date(value).getTime() > Date.now() ? `⏰ ފަހުން ނެރޭނެ: ${when}` : when;
}

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

// Facebook: tick the box and publish, and the next website update also posts the link on
// the Facebook page (scripts/post-facebook.mjs). The post time is filled in afterwards,
// which locks the box so the same item is never posted twice.
export const FACEBOOK_FIELDSET = {
  name: "facebook",
  title: "ފޭސްބުކް",
  options: { collapsible: false },
};

type FacebookDoc = { facebookPostedAt?: string; facebookShare?: boolean };
const posted = (document: unknown) => Boolean((document as FacebookDoc | undefined)?.facebookPostedAt);
const ticked = (document: unknown) => Boolean((document as FacebookDoc | undefined)?.facebookShare);

// withPicture: articles can post the share-button picture instead of the main photo.
export const facebookFields = ({ withPicture = false } = {}) => [
  defineField({
    name: "facebookShare",
    title: "ފޭސްބުކް ޕޭޖަށް ޝެއާ ކުރޭ",
    description:
      "ޓިކް ޖައްސަވައި ޕަބްލިޝް ކުރައްވައިފިނަމަ، ވެބްސައިޓަށް އެރުމާއެކު ފޭސްބުކް ޕޭޖަށްވެސް އަމިއްލައަށް ޕޯސްޓްވާނެ.",
    type: "boolean",
    initialValue: false,
    options: { layout: "switch" },
    fieldset: "facebook",
    readOnly: ({ document }) => posted(document),
  }),
  ...(withPicture
    ? [
        defineField({
          name: "facebookImage",
          title: "ފޭސްބުކުގައި ދައްކާނެ ފޮޓޯ",
          type: "string",
          options: {
            list: [
              { title: "ލިޔުމުގެ މައި ފޮޓޯ (ލިންކާއެކު)", value: "photo" },
              { title: "ޝެއާ ފޮޓޯ (ސުރުޚީ އާއި ޚުލާސާ ލިޔެވިފައިވާ)", value: "card" },
            ],
            layout: "radio",
          },
          initialValue: "photo",
          fieldset: "facebook",
          hidden: ({ document }) => !ticked(document),
          readOnly: ({ document }) => posted(document),
        }),
      ]
    : []),
  defineField({
    name: "facebookText",
    title: "ފޭސްބުކް ޕޯސްޓުގައި ލިޔާނެ ބަސް",
    description: "ހުސްކޮށް ބާއްވައިފިނަމަ، ސުރުޚީ އާއި ކުރު ޚުލާސާ ލިޔެވޭނެ.",
    type: "text",
    rows: 3,
    fieldset: "facebook",
    hidden: ({ document }) => !ticked(document),
    readOnly: ({ document }) => posted(document),
  }),
  defineField({
    name: "facebookPostedAt",
    title: "ފޭސްބުކަށް ޕޯސްޓް ކުރި ވަގުތު",
    type: "datetime",
    fieldset: "facebook",
    readOnly: true,
    hidden: ({ document }) => !posted(document),
  }),
  defineField({ name: "facebookPostId", type: "string", hidden: true, readOnly: true }),
];
