import { defineType, defineField, defineArrayMember } from "sanity";

// One document holding the Privacy Policy page. While it is empty the site shows its built-in text.
export const privacyPolicy = defineType({
  name: "privacyPolicy",
  title: "ޕްރައިވެސީ ޕޮލިސީ",
  type: "document",
  fields: [
    defineField({ name: "intro", title: "ތައާރަފު", type: "text", rows: 4 }),
    defineField({
      name: "sections",
      title: "ބައިތައް",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "policySection",
          fields: [
            defineField({ name: "heading", title: "ސުރުޚީ", type: "string" }),
            defineField({
              name: "body",
              title: "ލިޔުން",
              description: "ޕެރެގްރާފްތައް ވަކިކުރުމަށް ހުސް ލައިނެއް ދޫކޮށްލާ",
              type: "text",
              rows: 6,
            }),
          ],
          preview: { select: { title: "heading" } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "ޕްރައިވެސީ ޕޮލިސީ" }) },
});
