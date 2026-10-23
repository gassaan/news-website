"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./src/sanity/schemaTypes";
import project from "./src/sanity/project.json";
import { studioTheme } from "./src/sanity/theme";
import StudioLogo from "./src/sanity/StudioLogo";
import Dashboard from "./src/sanity/dashboard/Dashboard";
import DashboardIcon from "./src/sanity/dashboard/DashboardIcon";
import StudioNavbar from "./src/sanity/notifications/StudioNavbar";
import StudioHome from "./src/sanity/home/StudioHome";
import VoiceTraining from "./src/sanity/voice/VoiceTraining";
import SectionList from "./src/sanity/home/SectionList";
import { CardField } from "./src/sanity/editor/inputs";

export default defineConfig({
  name: "hulhangu",
  title: "Hulhangu",
  icon: StudioLogo,
  // Our own top bar: logo and name, search, the notifications bell and the editor's menu.
  studio: { components: { navbar: StudioNavbar } },
  theme: studioTheme,
  projectId: project.projectId || "missing",
  dataset: project.dataset,
  // The Studio lives at /studio inside the site (plus the GitHub Pages sub-path).
  basePath: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/studio`,
  plugins: [
    structureTool({
      // The start screen (StudioHome) shows a tile for each section; tapping one opens
      // the list or form below.
      structure: (S) => {
        const single = (type: string) => S.document().schemaType(type).documentId(type);
        // A section's list (SectionList): search, status filters, month groups; items open beside it.
        const list = (type: string) =>
          S.component(SectionList)
            .id(type)
            .options({ type })
            .child((id) => S.document().documentId(id).schemaType(type));
        const children: Record<string, () => ReturnType<typeof single> | ReturnType<typeof list> | ReturnType<typeof S.component>> = {
          // Recording sentences to train a voice for reading articles aloud.
          voiceTraining: () => S.component(VoiceTraining).id("voiceTraining").title("Voice training"),
          // Single documents: the red breaking news strip, the home page's big top card and the site pages.
          breakingNews: () => single("breakingNews"),
          featuredArticles: () => single("featuredArticles"),
          contactInfo: () => single("contactInfo"),
          privacyPolicy: () => single("privacyPolicy"),
          termsOfUse: () => single("termsOfUse"),
          article: () => list("article"),
          story: () => list("story"),
          author: () => list("author"),
          photoAlbum: () => list("photoAlbum"),
          graphic: () => list("graphic"),
          poll: () => list("poll"),
          comment: () => list("comment"),
        };
        return S.component(StudioHome)
          .id("root")
          .child((id) => children[id]?.());
      },
    }),
  ],
  // The editors' dashboard: views, waiting comments, polls and readers.
  tools: (prev) => [...prev, { name: "dashboard", title: "Dashboard", icon: DashboardIcon, component: Dashboard }],
  schema: { types: schemaTypes },
  // The editing form: every field in its own rounded card.
  form: { components: { field: CardField } },
});
