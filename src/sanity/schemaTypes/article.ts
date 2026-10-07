import { defineType, defineField } from "sanity";
import { CATEGORY_OPTIONS, bodyField, dateTimeField, formatWhen, photoField, slugField, titleField } from "./fields";

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
    dateTimeField(),
    photoField("image", "މައި ފޮޓޯ", true),
    defineField({
      name: "excerpt",
      title: "ކުރު ޚުލާސާ",
      // Used on the home page top story and on the article's share picture.
      description:
        "ހޯމްޕޭޖުގެ މައި ޚަބަރާއި، ޝެއާ ކުރާ ފޮޓޯގައި ދައްކާނީ މިއެވެ. ފޮޓޯގައި ފުރިހަމައަށް ފެންނާނީ ގާތްގަނޑަކަށް 250 އަކުރު.",
      type: "text",
      rows: 3,
      validation: (r) =>
        r.max(250).warning("250 އަކުރަށް ވުރެ ދިގު. ޝެއާ ކުރާ ފޮޓޯގައި ފަހަތު ބައި ކެނޑިގެންދާނެ."),
    }),
    bodyField(),
    defineField({
      name: "featured",
      title: "މައި ސްލައިޑަރުގައި ދައްކާ",
      type: "boolean",
      initialValue: false,
    }),
  ],
  orderings: [{ title: "އެންމެ އާ", name: "newest", by: [{ field: "publishedAt", direction: "desc" }] }],
  preview: {
    select: { title: "title", date: "publishedAt", media: "image" },
    prepare: ({ title, date, media }) => ({ title, subtitle: formatWhen(date), media }),
  },
});
