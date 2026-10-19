import { defineType, defineField } from "sanity";
import { FeaturedInput } from "../editor/inputs";

// One document: the articles shown in the big card at the top of the home page, in this order.
export const featuredArticles = defineType({
  name: "featuredArticles",
  title: "މައި ކާޑުގެ ލިޔުންތައް",
  type: "document",
  fields: [
    defineField({
      name: "articles",
      title: "ލިޔުންތައް",
      description: "ހޯމްޕޭޖުގެ މަތީގައިވާ ބޮޑު ކާޑުގައި ދައްކާނީ މި ލިޔުންތަކެވެ، މި ތަރުތީބުން.",
      type: "array",
      of: [{ type: "reference", to: [{ type: "article" }] }],
      components: { input: FeaturedInput },
      validation: (r) => r.unique().max(8),
    }),
  ],
  preview: { prepare: () => ({ title: "މައި ކާޑުގެ ލިޔުންތައް" }) },
});
