import { defineType, defineField } from "sanity";
import { CATEGORY_OPTIONS, bodyField, dateField, photoField, slugField, titleField } from "./fields";

export const article = defineType({
  name: "article",
  title: "ޚަބަރު / ރިޕޯޓު",
  type: "document",
  fields: [
    titleField(),
    slugField(),
    defineField({
      name: "category",
      title: "ކެޓެގަރީ",
      type: "string",
      options: { list: CATEGORY_OPTIONS, layout: "radio" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "author",
      title: "ލިޔުންތެރިޔާ",
      type: "reference",
      to: [{ type: "author" }],
      validation: (r) => r.required(),
    }),
    dateField(),
    photoField("image", "މައި ފޮޓޯ", true),
    defineField({ name: "excerpt", title: "ކުރު ޚުލާސާ", type: "text", rows: 3 }),
    bodyField(),
    defineField({
      name: "featured",
      title: "މައި ސްލައިޑަރުގައި ދައްކާ",
      type: "boolean",
      initialValue: false,
    }),
  ],
  orderings: [{ title: "އެންމެ އާ", name: "newest", by: [{ field: "publishedAt", direction: "desc" }] }],
  preview: { select: { title: "title", subtitle: "publishedAt", media: "image" } },
});
