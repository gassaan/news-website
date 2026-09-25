import { defineType, defineField } from "sanity";
import { slugField } from "./fields";

export const author = defineType({
  name: "author",
  title: "ލިޔުންތެރިން",
  type: "document",
  fields: [
    defineField({ name: "title", title: "ނަން", type: "string", validation: (r) => r.required() }),
    slugField(),
    defineField({ name: "role", title: "މަޤާމު", type: "string", initialValue: "ރިޕޯޓަރު" }),
    defineField({ name: "bio", title: "ތައާރަފު", type: "text", rows: 4 }),
    defineField({ name: "photo", title: "ފޮޓޯ", type: "image", options: { hotspot: true } }),
  ],
  preview: { select: { title: "title", subtitle: "role", media: "photo" } },
});
