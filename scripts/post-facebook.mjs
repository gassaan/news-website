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
//
// Articles can choose the picture: their main photo as a link preview (the default), or
// the share-button picture (headline and summary on a card), posted as a photo with the
// link in the text. That picture is drawn by the article page itself, so this opens the
// page in a headless browser (installed only when needed) and asks it for the picture.
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

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
  | order(publishedAt asc) { _id, _type, title, excerpt, facebookText, facebookImage, "slug": slug.current }`);

if (!pending.length) {
  console.log("[facebook] Nothing new to post.");
  process.exit(0);
}

let browser;
async function sharePicture(link) {
  if (!browser) {
    let playwright;
    try {
      playwright = await import("playwright");
    } catch {
      console.log("[facebook] Installing a headless browser for the share picture…");
      execSync("npm install --no-save playwright@1.56.1 && npx playwright install --with-deps chromium", {
        stdio: "inherit",
      });
      playwright = await import("playwright");
    }
    browser = await playwright.chromium.launch();
  }
  const page = await browser.newPage();
  try {
    await page.goto(link, { waitUntil: "networkidle" });
    await page.waitForFunction(() => typeof window.hulhanguSharePicture === "function", null, { timeout: 30_000 });
    const base64 = await page.evaluate(async () => {
      const blob = await window.hulhanguSharePicture();
      if (!blob) return null;
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let text = "";
      for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return btoa(text);
    });
    if (!base64) throw new Error("the page could not draw the picture");
    return Buffer.from(base64, "base64");
  } finally {
    await page.close();
  }
}

async function graphPost(path, body) {
  const res = await fetch(`${GRAPH}/${pageId}/${path}`, { method: "POST", body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.id) throw new Error(`Facebook said ${res.status}: ${JSON.stringify(json.error ?? json)}`);
  // A photo answers with the photo id and the post id; the post id is the one people see.
  return json.post_id ?? json.id;
}

let failed = 0;
for (const item of pending) {
  const link = `${SITE_URL}/${item._type === "story" ? "story" : "article"}/${cleanSlug(item.slug)}/`;
  const message = (item.facebookText?.trim() || [item.title, item.excerpt].filter(Boolean).join("\n\n")).trim();
  try {
    if (!(await waitForPage(link))) throw new Error(`page not online yet: ${link}`);
    let postId;
    if (item._type === "article" && item.facebookImage === "card") {
      const picture = await sharePicture(link);
      const form = new FormData();
      form.append("source", new Blob([picture], { type: "image/jpeg" }), `hulhangu-${cleanSlug(item.slug)}.jpg`);
      form.append("message", `${message}\n\n${link}`);
      form.append("access_token", pageToken);
      postId = await graphPost("photos", form);
    } else {
      postId = await graphPost("feed", new URLSearchParams({ message, link, access_token: pageToken }));
    }

    // Save the post time on the item, and on its unpublished changes if there are any,
    // so a later publish can't bring the tick back without a post time.
    const ids = [item._id];
    const draft = await sanityQuery(`*[_id == "drafts.${item._id}"][0]._id`, "raw");
    if (draft) ids.push(draft);
    await sanityPatch(ids, { facebookPostedAt: new Date().toISOString(), facebookPostId: postId });
    console.log(`[facebook] Posted "${item.title}" → ${postId}`);
  } catch (err) {
    failed++;
    console.error(`[facebook] Could not post "${item.title}": ${err.message}`);
  }
}

await browser?.close();

// A red mark on the workflow tells the owner something needs attention (for example an expired token).
if (failed) process.exit(1);
