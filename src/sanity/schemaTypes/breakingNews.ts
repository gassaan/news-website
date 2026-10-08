import { defineType, defineField } from "sanity";

// One document: the red moving strip shown under the header on every article page.
export const breakingNews = defineType({
  name: "breakingNews",
  title: "އަވަސް ޚަބަރު",
  type: "document",
  fields: [
    defineField({
      name: "on",
      title: "ވެބްސައިޓުގައި ދައްކާ",
      description: "ހުޅުވާލުމުން ހުރިހާ ޚަބަރެއްގެ ސަފްހާގެ މަތީގައި ރަތް ސްޓްރިޕް ފެންނާނެ. ނިންމާލުމުން ފޮރުވޭނެ.",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "headline",
      title: "ސުރުހީ",
      description: "ހުސްކޮށް ބާއްވައިފިނަމަ، ތިރީގައި އިޚްތިޔާރުކުރާ ޚަބަރުގެ ސުރުހީ ދައްކާނެ.",
      type: "string",
    }),
    defineField({
      name: "article",
      title: "ފިއްތުމުން ހުޅުވޭނެ ޚަބަރު",
      type: "reference",
      to: [{ type: "article" }],
    }),
  ],
  validation: (r) =>
    r.custom((doc) =>
      doc?.on && !(doc.headline as string | undefined)?.trim() && !doc.article
        ? "ސުރުހީއެއް ލިޔުއްވާ، ނުވަތަ ޚަބަރެއް އިޚްތިޔާރުކުރައްވާ"
        : true,
    ),
  preview: { prepare: () => ({ title: "އަވަސް ޚަބަރު" }) },
});
