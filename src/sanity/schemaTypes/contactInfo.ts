import { defineType, defineField } from "sanity";

// One document holding the details shown on the Contact Us page. Empty fields are hidden on the site.
export const contactInfo = defineType({
  name: "contactInfo",
  title: "ގުޅުއްވުމަށް",
  type: "document",
  fields: [
    defineField({
      name: "intro",
      title: "ތައާރަފު",
      description: "ސަފްހާގެ މަތީގައި ފެންނަ ކުރު ޖުމްލަ",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "email",
      title: "އީމެއިލް",
      type: "string",
      validation: (r) => r.email().error("ރަނގަޅު އީމެއިލް އެޑްރެހެއް ލިޔުއްވާ"),
    }),
    defineField({ name: "phone", title: "ފޯނު ނަންބަރު", description: "މިސާލު: 7771234", type: "string" }),
    defineField({
      name: "whatsapp",
      title: "ވަޓްސްއެޕް ނަންބަރު",
      description: "ގައުމީ ކޯޑާއެކު، މިސާލު: 9607771234",
      type: "string",
    }),
    defineField({ name: "address", title: "އެޑްރެސް", type: "text", rows: 2 }),
    defineField({ name: "hours", title: "ހުޅުވާލާ ގަޑިތައް", description: "މިސާލު: އާދިއްތަ - ބުރާސްފަތި، 9:00 - 17:00", type: "string" }),
  ],
  preview: { prepare: () => ({ title: "ގުޅުއްވުމަށް" }) },
});
