import { defineField, defineType } from "sanity";
import { AD_PLACES } from "../../lib/adPlaces";
import { DateTimeInput, PhotoInput } from "../editor/inputs";
import { AdStatsInput, PlacesInput } from "../editor/ads";

// An advert: shown in the "Advertise here" spaces on the site between its dates.
export const ad = defineType({
  name: "ad",
  title: "Ads",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Advertiser", type: "string", description: "For the newsroom only, e.g. \"Sea Breeze Café – December\"", validation: (r) => r.required() }),
    defineField({
      name: "wide",
      title: "Wide banner",
      description: "Shown across the page. Best size 1456 × 364 (4 to 1). It's never cropped.",
      type: "image",
      components: { input: PhotoInput },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "square",
      title: "Square picture",
      description: "Optional. Shown inside articles (1080 × 1080). Without it, articles show the wide banner.",
      type: "image",
      components: { input: PhotoInput },
    }),
    defineField({
      name: "link",
      title: "Link",
      description: "Where the ad opens when a reader taps it",
      type: "url",
      validation: (r) => r.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "places",
      title: "Where to show",
      type: "array",
      of: [{ type: "string" }],
      options: { list: AD_PLACES },
      initialValue: AD_PLACES.map((p) => p.value),
      components: { input: PlacesInput },
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: "startsAt",
      title: "Starts",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      options: { plain: true } as object,
      components: { input: DateTimeInput },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "endsAt",
      title: "Ends",
      description: "Leave empty to keep it running until you pause or delete it.",
      type: "datetime",
      options: { plain: true, clearable: "No end date" } as object,
      components: { input: DateTimeInput },
      validation: (r) =>
        r.custom((end, ctx) => {
          const start = (ctx.document as { startsAt?: string } | undefined)?.startsAt;
          return typeof end === "string" && start && Date.parse(end) <= Date.parse(start) ? "The end must be after the start" : true;
        }),
    }),
    defineField({
      name: "paused",
      title: "Pause this ad",
      description: "Hides it now without changing the dates (the site updates within about 10 minutes).",
      type: "boolean",
      initialValue: false,
      options: { layout: "switch" },
    }),
    defineField({ name: "stats", title: "How it's doing", type: "string", readOnly: true, components: { input: AdStatsInput } }),
  ],
  preview: { select: { title: "name", media: "wide" } },
});
