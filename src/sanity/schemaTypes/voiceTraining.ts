import { defineArrayMember, defineField, defineType } from "sanity";

// Recordings from the Voice training page (src/sanity/voice): each sentence read aloud,
// kept to train a voice for reading articles automatically. Not shown on the website.
export const voiceTraining = defineType({
  name: "voiceTraining",
  title: "Voice training",
  type: "document",
  fields: [
    defineField({
      name: "clips",
      title: "Recordings",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "clip",
          fields: [
            defineField({ name: "text", title: "Sentence", type: "text", rows: 2 }),
            defineField({ name: "audio", title: "Recording", type: "file" }),
            defineField({ name: "seconds", title: "Length (seconds)", type: "number" }),
          ],
          preview: { select: { title: "text", subtitle: "seconds" } },
        }),
      ],
    }),
  ],
});
