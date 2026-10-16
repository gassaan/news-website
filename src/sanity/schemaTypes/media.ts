import { defineType, defineField, defineArrayMember } from "sanity";
import {
  dateField,
  formatWhen,
  photoField,
  slugField,
  titleField,
} from "./fields";
import PollDurationInput from "../components/PollDurationInput";
import MultiPhotoUpload from "../components/MultiPhotoUpload";

export const graphic = defineType({
  name: "graphic",
  title: "ގުރެފިކްސް",
  type: "document",
  fields: [
    titleField(),
    slugField(),
    dateField("date"),
    photoField("image", "ގުރެފިކް (ދިގު ފޮޓޯ)", true),
  ],
  preview: {
    select: { title: "title", date: "date", media: "image" },
    prepare: ({ title, date, media }) => ({
      title,
      subtitle: formatWhen(date),
      media,
    }),
  },
});

export const photoAlbum = defineType({
  name: "photoAlbum",
  title: "ފޮޓޯ ގެލެރީ",
  type: "document",
  fields: [
    titleField(),
    slugField(),
    dateField("date"),
    defineField({ name: "photographer", title: "ފޮޓޯ ނެގީ", type: "reference", to: [{ type: "author" }] }),
    defineField({
      name: "photos",
      title: "ފޮޓޯތައް",
      type: "array",
      of: [defineArrayMember({ type: "image", options: { hotspot: true } })],
      options: { layout: "grid" },
      // Adds a "choose many photos at once" button above the list.
      components: { input: MultiPhotoUpload },
      validation: (r) => r.min(1),
    }),
  ],
  preview: {
    select: { title: "title", date: "date", media: "photos.0" },
    prepare: ({ title, date, media }) => ({
      title,
      subtitle: formatWhen(date),
      media,
    }),
  },
});

export const poll = defineType({
  name: "poll",
  title: "ޕޯލްސް",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "ސުވާލު",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "options",
      title: "ޖަވާބުތައް",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      validation: (r) => r.min(2),
    }),
    defineField({
      name: "closesAt",
      title: "ވޯޓު ނިމޭ ވަގުތު",
      description: "ބަޓަނަކަށް ފިތުމުން މިހާރުން ފެށިގެން ގުނާނެ. ވޯޓު ނިމުމުން ސައިޓުގައި ނަތީޖާ ދައްކާނެ. ހުސްކޮށް ބާއްވައިފިނަމަ ވޯޓު ނުނިމޭނެ.",
      type: "datetime",
      components: { input: PollDurationInput },
    }),
    photoField("image", "ފޮޓޯ"),
    dateField(),
  ],
  preview: {
    select: { title: "title", media: "image", closesAt: "closesAt" },
    prepare: ({ title, media, closesAt }) => ({
      title,
      media,
      subtitle: !closesAt ? undefined : Date.parse(closesAt) <= Date.now() ? "ވޯޓު ނިމިއްޖެ" : "ވޯޓު ހުޅުވިފައި",
    }),
  },
});
