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
  plugins: [structureTool()],
  schema: { types: schemaTypes },
});
