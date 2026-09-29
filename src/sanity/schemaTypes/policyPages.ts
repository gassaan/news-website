import { defineType, defineField, defineArrayMember } from "sanity";

// A single document for a policy page. While it has no sections the site shows its built-in text.
function policyDocument(name: string, title: string) {
  return defineType({
    name,
    title,
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
    preview: { prepare: () => ({ title }) },
  });
}

export const privacyPolicy = policyDocument("privacyPolicy", "ޕްރައިވެސީ ޕޮލިސީ");
export const termsOfUse = policyDocument("termsOfUse", "ބޭނުންކުރުމުގެ ޝަރުތުތައް");
