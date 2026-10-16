import { defineField, defineType } from "sanity";

// Readers' comments. They arrive from the site as unpublished drafts; pressing
// Publish puts a comment on the site, deleting it removes it.
export const comment = defineType({
  name: "comment",
  title: "ކޮމެންޓްތައް",
  type: "document",
  description: "ސައިޓުގައި ފެންނާނީ ޕަބްލިޝް ކުރުމުން. ބޭނުން ނުވާ ކޮމެންޓް ޑިލީޓް ކުރައްވާ.",
  fields: [
    defineField({ name: "name", title: "ނަން", type: "string", validation: (r) => r.required().max(60) }),
    defineField({ name: "text", title: "ކޮމެންޓް", type: "text", rows: 4, validation: (r) => r.required().max(1000) }),
    defineField({
      name: "post",
      title: "ލިޔުން",
      type: "reference",
      to: [{ type: "article" }, { type: "story" }],
      weak: true,
      readOnly: true,
    }),
    defineField({ name: "parent", title: "ޖަވާބު ދީފައިވާ ކޮމެންޓް", type: "string", readOnly: true, hidden: ({ value }) => !value }),
    defineField({ name: "target", type: "string", readOnly: true, hidden: true }),
    defineField({ name: "kind", type: "string", readOnly: true, hidden: true }),
    defineField({ name: "submittedAt", title: "ފޮނުވި ވަގުތު", type: "datetime", readOnly: true }),
  ],
  orderings: [{ title: "އެންމެ އާ", name: "newest", by: [{ field: "submittedAt", direction: "desc" }] }],
  preview: {
    select: { name: "name", text: "text", post: "post.title" },
    prepare: ({ name, text, post }) => ({
      title: `${name ?? ""}: ${(text ?? "").slice(0, 80)}`,
      subtitle: post ? `↳ ${post}` : undefined,
    }),
  },
});
