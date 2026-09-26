// Downloads published content from the Sanity dashboard before each build and saves it
// where the site reads it (src/content). Without a project ID, or with SKIP_CMS=1,
// it writes empty files so the site shows its built-in sample content.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const root = new URL("..", import.meta.url);
const out = (p) => new URL(p, root);
const { projectId, dataset } = JSON.parse(readFileSync(out("src/sanity/project.json"), "utf8"));

function write(cms, images, stamp) {
  mkdirSync(out("src/content"), { recursive: true });
  writeFileSync(out("src/content/cms.json"), JSON.stringify(cms, null, 1) + "\n");
  writeFileSync(out("src/content/cms-images.json"), JSON.stringify(images, null, 1) + "\n");
  if (stamp) {
    mkdirSync(out("public"), { recursive: true });
    writeFileSync(out("public/cms-stamp.txt"), stamp + "\n");
  }
}

if (!projectId || process.env.SKIP_CMS === "1") {
  console.log("[cms] No Sanity project configured (or SKIP_CMS=1): using sample content.");
  write({}, {});
  process.exit(0);
}

const img = `{ "url": asset->url, hotspot }`;
const QUERY = `{
  "authors": *[_type == "author" && defined(slug.current)] { "slug": slug.current, "name": title, role, bio, "photo": photo ${img} },
  "articles": *[_type == "article" && defined(slug.current)] | order(publishedAt desc) {
    "slug": slug.current, title, excerpt, body, category, "author": author->title, publishedAt, _createdAt, featured, "image": image ${img} },
  "stories": *[_type == "story" && defined(slug.current)] | order(publishedAt desc) {
    "slug": slug.current, title, excerpt, "author": author->title, publishedAt, _createdAt, "poster": poster ${img}, episodes[] { title, body } },
  "polls": *[_type == "poll"] | order(publishedAt desc) { _id, title, options, "image": image ${img} },
  "graphics": *[_type == "graphic" && defined(slug.current)] | order(date desc) { "slug": slug.current, title, date, "image": image ${img} },
  "albums": *[_type == "photoAlbum" && defined(slug.current)] | order(date desc) {
    "slug": slug.current, title, date, photographer, "photos": photos[] ${img} },
  "stamp": { "latest": *[] | order(_updatedAt desc)[0]._updatedAt, "count": count(*[]) }
}`;

const url =
  `https://${projectId}.api.sanity.io/v2025-02-19/data/query/${dataset}` +
  `?perspective=published&query=${encodeURIComponent(QUERY)}`;

const res = await fetch(url);
if (!res.ok) {
  // Fail the build rather than publishing the sample content over real content.
  console.error(`[cms] Sanity request failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}
const { result: r } = await res.json();

const images = {};
function addImage(key, image, width) {
  if (!image?.url) return;
  const h = image.hotspot;
  images[key] = {
    src: `${image.url}?w=${width}&auto=format&q=75`,
    ...(h ? { pos: `${Math.round(h.x * 100)}% ${Math.round(h.y * 100)}%` } : {}),
  };
}
// Dashboard times are UTC; the site shows Maldives time (UTC+5).
const MV_OFFSET_MS = 5 * 60 * 60 * 1000;
function mvDateTime(publishedAt, createdAt) {
  // Older entries only have a date: keep it, and take the time from when the entry was created.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(publishedAt ?? "");
  const moment = new Date(new Date(dateOnly ? createdAt : publishedAt).getTime() + MV_OFFSET_MS);
  const iso = moment.toISOString();
  return { date: dateOnly ? publishedAt : iso.slice(0, 10), time: iso.slice(11, 16) };
}

// Safety net for web addresses: anything other than a-z, 0-9 becomes "-" (e.g. "report/1000" -> "report-1000").
const cleanSlug = (slug) =>
  String(slug ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
for (const list of [r.authors, r.articles, r.stories, r.graphics, r.albums]) {
  for (const item of list) item.slug = cleanSlug(item.slug);
}

const paragraphs = (text) =>
  (text ?? "").split(/\n+/).map((p) => p.trim()).filter(Boolean);

const cms = {};

if (r.authors.length) {
  cms.authors = r.authors.map((a) => {
    addImage(`author-${a.slug}`, a.photo, 400);
    return { slug: a.slug, name: a.name, role: a.role ?? "", bio: a.bio ?? "" };
  });
}

const toArticle = (a) => {
  addImage(a.slug, a.image, 1600);
  const { date, time } = mvDateTime(a.publishedAt, a._createdAt);
  return {
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt ?? "",
    body: paragraphs(a.body),
    category: a.category,
    author: a.author ?? "",
    publishedAt: date,
    time,
    ...(a.featured ? { featured: true } : {}),
  };
};
const news = r.articles.filter((a) => a.category !== "report");
const reports = r.articles.filter((a) => a.category === "report");
if (news.length) cms.articles = news.map(toArticle);
if (reports.length) cms.reports = reports.map(toArticle);

if (r.stories.length) {
  cms.stories = r.stories.map((s) => {
    addImage(s.slug, s.poster, 1600);
    const episodes = (s.episodes ?? []).map((e) => ({ title: e.title, body: paragraphs(e.body) }));
    const { date, time } = mvDateTime(s.publishedAt, s._createdAt);
    return {
      slug: s.slug,
      title: s.title,
      excerpt: s.excerpt ?? "",
      body: episodes[0]?.body ?? [],
      category: "",
      author: s.author ?? "",
      publishedAt: date,
      time,
      episodes,
    };
  });
}

if (r.polls.length) {
  cms.polls = r.polls.map((p) => {
    addImage(p._id, p.image, 1200);
    const options = p.options ?? [];
    return { id: p._id, question: p.title, options, votes: options.map(() => 0) };
  });
}

if (r.graphics.length) {
  cms.graphics = r.graphics.map((g) => {
    addImage(g.slug, g.image, 1200);
    return { slug: g.slug, title: g.title, date: g.date };
  });
}

if (r.albums.length) {
  cms.photoAlbums = r.albums.map((a) => {
    (a.photos ?? []).forEach((p, i) => addImage(`${a.slug}-${i + 1}`, p, 1600));
    return {
      slug: a.slug,
      title: a.title,
      date: a.date,
      photographer: a.photographer ?? "",
      photoCount: (a.photos ?? []).length,
    };
  });
}

write(cms, images, `${r.stamp.latest ?? ""}|${r.stamp.count}`);
console.log(
  `[cms] Loaded from Sanity: ${Object.entries(cms).map(([k, v]) => `${v.length} ${k}`).join(", ") || "nothing yet (sample content stays)"}.`,
);
