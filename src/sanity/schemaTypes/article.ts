import { defineType, defineField } from "sanity";
import { AudioInput, ChoiceInput, PollPickInput, SummaryInput, WriterInput } from "../editor/inputs";
import { CATEGORY_OPTIONS, FACEBOOK_FIELDSET, facebookFields, bodyField, dateTimeField, formatPublish, photoField, slugField, titleField } from "./fields";

export const article = defineType({
  name: "article",
  title: "ޚަބަރު / ރިޕޯޓު",
  type: "document",
  fieldsets: [FACEBOOK_FIELDSET],
  fields: [
    titleField(),
    slugField(),
    defineField({
      name: "category",
      title: "ކެޓެގަރީ",
      type: "string",
      options: { list: CATEGORY_OPTIONS, layout: "radio" },
      components: { input: ChoiceInput },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "author",
      title: "ލިޔުންތެރިޔާ",
      type: "reference",
      to: [{ type: "author" }],
      components: { input: WriterInput },
      validation: (r) => r.required(),
    }),
    dateTimeField(),
    photoField("image", "މައި ފޮޓޯ", true),
    defineField({
      name: "audio",
      title: "ލިޔުން ކިޔާދީފައިވާ އަޑު",
      // Optional: with audio, the website shows a play button on the main photo.
      description: "ބޭނުންނަމަ ލިޔުން ކިޔާ އަޑު ރެކޯޑްކުރައްވާ، ނުވަތަ އަޑުގެ ފައިލެއް ލައްވާ. ސައިޓުގައި ފޮޓޯގެ މަތީގައި ޕްލޭ ބަޓަނެއް ފެންނާނެ.",
      type: "file",
      options: { accept: "audio/*" },
      components: { input: AudioInput },
    }),
    defineField({
      name: "excerpt",
      title: "ކުރު ޚުލާސާ",
      // Used on the home page top story and on the article's share picture.
      description:
        "ހޯމްޕޭޖުގެ މައި ޚަބަރާއި، ޝެއާ ކުރާ ފޮޓޯގައި ދައްކާނީ މިއެވެ. ފޮޓޯގައި ފުރިހަމައަށް ފެންނާނީ ގާތްގަނޑަކަށް 250 އަކުރު.",
      type: "text",
      rows: 3,
      components: { input: SummaryInput },
      validation: (r) =>
        r.max(250).warning("250 އަކުރަށް ވުރެ ދިގު. ޝެއާ ކުރާ ފޮޓޯގައި ފަހަތު ބައި ކެނޑިގެންދާނެ."),
    }),
    bodyField(),
    defineField({
      name: "poll",
      title: "ލިޔުމުގެ ތިރީގައި ޕޯލް",
      description: "ލިޔުމުގެ ތިރީގައި ދައްކާނީ މި ޕޯލެވެ. \"ޕޯލެއް ނުދައްކާ\" ހޮވައިފިނަމަ ޕޯލެއް ނުދައްކާނެ.",
      type: "reference",
      to: [{ type: "poll" }],
      // Weak, so a poll can still be deleted after an article has used it.
      weak: true,
      components: { input: PollPickInput },
    }),
    ...facebookFields({ withPicture: true }),
    defineField({
      name: "featured",
      title: "މައި ސްލައިޑަރުގައި ދައްކާ",
      type: "boolean",
      initialValue: false,
      // Replaced by the "މައި ކާޑުގެ ލިޔުންތައް" list; kept hidden so saved values stay valid.
      hidden: true,
    }),
  ],
  orderings: [{ title: "އެންމެ އާ", name: "newest", by: [{ field: "publishedAt", direction: "desc" }] }],
  preview: {
    select: { title: "title", date: "publishedAt", media: "image" },
    prepare: ({ title, date, media }) => ({ title, subtitle: formatPublish(date), media }),
  },
});
