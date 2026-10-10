import { defineType, defineField } from "sanity";

// One document: the articles shown in the big card at the top of the home page, in this order.
export const featuredArticles = defineType({
  name: "featuredArticles",
  title: "މައި ކާޑުގެ ލިޔުންތައް",
  type: "document",
  fields: [
    defineField({
      name: "articles",
      title: "ލިޔުންތައް",
      description:
        "ހޯމްޕޭޖުގެ މަތީގައިވާ ބޮޑު ކާޑުގައި ދައްކާނީ މި ލިޔުންތަކެވެ، މި ތަރުތީބުން. ތަރުތީބު ބަދަލުކުރަން ⠿ ދަމާލައްވާ. ހުސްކޮށް ބާއްވައިފިނަމަ އެންމެ އާ 5 ޚަބަރު ދައްކާނެ.",
      type: "array",
      of: [{ type: "reference", to: [{ type: "article" }] }],
      validation: (r) => r.unique().max(8),
    }),
  ],
  preview: { prepare: () => ({ title: "މައި ކާޑުގެ ލިޔުންތައް" }) },
});
