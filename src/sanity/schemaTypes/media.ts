import { defineType, defineField, defineArrayMember } from "sanity";
import { dateField, photoField, slugField, titleField } from "./fields";

export const graphic = defineType({
  name: "graphic",
  title: "ގުރެފިކްސް",
  type: "document",
  fields: [titleField(), slugField(), dateField("date"), photoField("image", "ގުރެފިކް (ދިގު ފޮޓޯ)", true)],
  preview: { select: { title: "title", subtitle: "date", media: "image" } },
});

export const photoAlbum = defineType({
  name: "photoAlbum",
  title: "ފޮޓޯ ގެލެރީ",
  type: "document",
  fields: [
    titleField(),
    slugField(),
    dateField("date"),
    defineField({ name: "photographer", title: "ފޮޓޯ ނެގީ", type: "string" }),
    defineField({
      name: "photos",
      title: "ފޮޓޯތައް",
      type: "array",
      of: [defineArrayMember({ type: "image", options: { hotspot: true } })],
      options: { layout: "grid" },
      validation: (r) => r.min(1),
    }),
  ],
  preview: { select: { title: "title", subtitle: "date", media: "photos.0" } },
});

export const poll = defineType({
  name: "poll",
  title: "ޕޯލްސް",
  type: "document",
  fields: [
    defineField({ name: "title", title: "ސުވާލު", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "options",
      title: "ޖަވާބުތައް",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      validation: (r) => r.min(2),
    }),
    photoField("image", "ފޮޓޯ"),
    dateField(),
  ],
  preview: { select: { title: "title", media: "image" } },
});
