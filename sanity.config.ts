"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./src/sanity/schemaTypes";
import project from "./src/sanity/project.json";

export default defineConfig({
  name: "hulhangu",
  title: "Hulhangu",
  projectId: project.projectId || "missing",
  dataset: project.dataset,
  // The Studio lives at /studio inside the site (plus the GitHub Pages sub-path).
  basePath: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/studio`,
  plugins: [
    structureTool({
      // Every list shows the newest item first.
      structure: (S) =>
        S.list()
          .title("Hulhangu")
          .items([
            ...[
              ["article", "publishedAt"],
              ["story", "publishedAt"],
              ["author", "title"],
              ["photoAlbum", "date"],
              ["graphic", "date"],
              ["poll", "publishedAt"],
            ].map(([type, field]) =>
              S.documentTypeListItem(type).child(
                S.documentTypeList(type).defaultOrdering([
                  { field, direction: field === "title" ? "asc" : "desc" },
                ]),
              ),
            ),
            S.divider(),
            // A single document: the details on the Contact Us page.
            S.listItem()
              .title("ގުޅުއްވުމަށް")
              .id("contactInfo")
              .child(S.document().schemaType("contactInfo").documentId("contactInfo")),
            S.listItem()
              .title("ޕްރައިވެސީ ޕޮލިސީ")
              .id("privacyPolicy")
              .child(S.document().schemaType("privacyPolicy").documentId("privacyPolicy")),
            S.listItem()
              .title("ބޭނުންކުރުމުގެ ޝަރުތުތައް")
              .id("termsOfUse")
              .child(S.document().schemaType("termsOfUse").documentId("termsOfUse")),
          ]),
    }),
  ],
  schema: { types: schemaTypes },
});
