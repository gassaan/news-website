import { defineType, defineField, defineArrayMember } from "sanity";
import { bodyField, dateTimeField, formatWhen, photoField, slugField, titleField } from "./fields";

export const story = defineType({
  name: "story",
  title: "ވާހަކަ",
  type: "document",
  fields: [
    titleField("ވާހަކައިގެ ނަން"),
    slugField(),
    defineField({
      name: "author",
      title: "ލިޔުންތެރިޔާ",
      type: "reference",
      to: [{ type: "author" }],
      validation: (r) => r.required(),
    }),
    dateTimeField(),
    photoField("poster", "ޕޯސްޓަރު", true),
    defineField({ name: "excerpt", title: "ކުރު ޚުލާސާ", type: "text", rows: 3 }),
    defineField({
      name: "episodes",
      title: "ބައިތައް",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "episode",
          title: "ބައި",
          fields: [
            defineField({ name: "title", title: "ބައިގެ ނަން", type: "string", validation: (r) => r.required() }),
            bodyField(),
          ],
        }),
      ],
      validation: (r) => r.min(1),
    }),
  ],
  preview: {
    select: { title: "title", date: "publishedAt", media: "poster" },
    prepare: ({ title, date, media }) => ({ title, subtitle: formatWhen(date), media }),
  },
});
