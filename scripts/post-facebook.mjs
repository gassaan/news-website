// Posts newly published articles and stories to the Facebook page, after the website
// update that put them online. Runs at the end of the deploy workflow.
//
// An item is posted once: it must have "ފޭސްބުކް ޕޭޖަށް ޝެއާ ކުރޭ" ticked, be live
// (its time has come), and not have a Facebook post time yet. After posting, the post
// time and Facebook post id are saved on the item, which also locks its tick box.
//
// Needs three GitHub secrets; without them it does nothing:
//   FACEBOOK_PAGE_ID     the page's numeric id
//   FACEBOOK_PAGE_TOKEN  a page access token allowed to publish (pages_manage_posts)
//   SANITY_WRITE_TOKEN   a Sanity "Editor" token, to save the post time
import { readFileSync } from "node:fs";

const GRAPH = "https://graph.facebook.com/v23.0";
const { FACEBOOK_PAGE_ID: pageId, FACEBOOK_PAGE_TOKEN: pageToken, SANITY_WRITE_TOKEN: sanityToken } = process.env;
const SITE_URL = (process.env.SITE_URL ?? "https://gassaan.github.io/news-website").replace(/\/$/, "");

if (!pageId || !pageToken || !sanityToken) {
  console.log("[facebook] Not set up (missing FACEBOOK_PAGE_ID, FACEBOOK_PAGE_TOKEN or SANITY_WRITE_TOKEN): skipping.");
  process.exit(0);
}

const { projectId, dataset } = JSON.parse(readFileSync(new URL("../src/sanity/project.json", import.meta.url), "utf8"));
const api = `https://${projectId}.api.sanity.io/v2025-02-19/data`;
const auth = { Authorization: `Bearer ${sanityToken}` };

// Same clean-up as scripts/fetch-cms.mjs, so the link matches the page the site built.
const cleanSlug = (slug) =>
  String(slug ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function sanityQuery(query, perspective = "published") {
  const url = `${api}/query/${dataset}?perspective=${perspective}&query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: auth });
  if (!res.ok) throw new Error(`Sanity query failed: ${res.status} ${await res.text()}`);
  return (await res.json()).result;
}

async function sanityPatch(ids, set) {
  const res = await fetch(`${api}/mutate/${dataset}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ mutations: ids.map((id) => ({ patch: { id, set } })) }),
  });
  if (!res.ok) throw new Error(`Sanity update failed: ${res.status} ${await res.text()}`);
}

// Wait until the page answers, so Facebook finds the new page (and its picture) when it reads the link.
async function waitForPage(url) {
  for (let i = 0; i < 18; i++) {
    const res = await fetch(url, { method: "HEAD" }).catch(() => null);
    if (res?.ok) return true;
    await new Promise((r) => setTimeout(r, 10_000));
  }
  return false;
}

const pending = await sanityQuery(`*[_type in ["article", "story"] && facebookShare == true
  && !defined(facebookPostedAt) && defined(slug.current) && publishedAt <= now()]
  | order(publishedAt asc) { _id, _type, title, excerpt, facebookText, "slug": slug.current }`);

if (!pending.length) {
  console.log("[facebook] Nothing new to post.");
  process.exit(0);
}

let failed = 0;
for (const item of pending) {
  const link = `${SITE_URL}/${item._type === "story" ? "story" : "article"}/${cleanSlug(item.slug)}/`;
  const message = (item.facebookText?.trim() || [item.title, item.excerpt].filter(Boolean).join("\n\n")).trim();
  try {
    if (!(await waitForPage(link))) throw new Error(`page not online yet: ${link}`);
    const res = await fetch(`${GRAPH}/${pageId}/feed`, {
      method: "POST",
      body: new URLSearchParams({ message, link, access_token: pageToken }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.id) throw new Error(`Facebook said ${res.status}: ${JSON.stringify(body.error ?? body)}`);

    // Save the post time on the item, and on its unpublished changes if there are any,
    // so a later publish can't bring the tick back without a post time.
    const ids = [item._id];
    const draft = await sanityQuery(`*[_id == "drafts.${item._id}"][0]._id`, "raw");
    if (draft) ids.push(draft);
    await sanityPatch(ids, { facebookPostedAt: new Date().toISOString(), facebookPostId: body.id });
    console.log(`[facebook] Posted "${item.title}" → ${body.id}`);
  } catch (err) {
    failed++;
    console.error(`[facebook] Could not post "${item.title}": ${err.message}`);
  }
}

// A red mark on the workflow tells the owner something needs attention (for example an expired token).
if (failed) process.exit(1);
