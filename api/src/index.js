// Hulhangu's small online service: counts article views, keeps poll votes, story
// ratings and comment likes, and passes new comments to the dashboard (Sanity) as
// unpublished drafts, so they only appear on the site once an editor publishes them.
//
// Readers are never stored by address: each request is identified by a one-way hash
// of the address plus a secret, and votes by a random id the reader's browser keeps.

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DOC_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
const VOTER = /^[A-Za-z0-9-]{16,64}$/;

// Requests allowed per reader per hour, by action.
const LIMITS = { view: 600, vote: 60, rate: 120, like: 300, comment: 6 };

const today = () => new Date().toISOString().slice(0, 10);
const hour = () => new Date().toISOString().slice(0, 13);

function cors(request, env) {
  const origin = request.headers.get("Origin") ?? "";
  const allowed = (env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim());
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0] ?? "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(data, status, headers, cache = 0) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cache ? `public, max-age=${cache}` : "no-store",
    },
  });
}

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Who is asking, without keeping who they are.
async function reader(request, env) {
  const ip = request.headers.get("CF-Connecting-IP") ?? "local";
  return (await sha256(`${env.SALT ?? env.SANITY_TOKEN ?? "hulhangu"}|${ip}`)).slice(0, 32);
}

// True when the reader is still under the hourly limit for this action.
async function allow(env, who, action) {
  const key = `${action}|${who}|${hour()}`;
  const row = await env.DB.prepare(
    "INSERT INTO hits (key, n) VALUES (?1, 1) ON CONFLICT(key) DO UPDATE SET n = n + 1 RETURNING n",
  )
    .bind(key)
    .first();
  return (row?.n ?? 1) <= LIMITS[action];
}

async function body(request) {
  try {
    const text = await request.text();
    if (text.length > 8000) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const clean = (s, max) =>
  String(s ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);

// ---------- Views ----------

async function addView(env, who, slug) {
  const day = today();
  const fresh = await env.DB.prepare("INSERT OR IGNORE INTO seen (key, day) VALUES (?1, ?2)")
    .bind(`${slug}|${who}|${day}`, day)
    .run();
  if (fresh.meta.changes) {
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO views (slug, n) VALUES (?1, 1) ON CONFLICT(slug) DO UPDATE SET n = n + 1",
      ).bind(slug),
      env.DB.prepare(
        "INSERT INTO views_daily (slug, day, n) VALUES (?1, ?2, 1) ON CONFLICT(slug, day) DO UPDATE SET n = n + 1",
      ).bind(slug, day),
    ]);
  }
  const row = await env.DB.prepare("SELECT n FROM views WHERE slug = ?1").bind(slug).first();
  return row?.n ?? 0;
}

async function topViewed(env, days, limit) {
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const { results } = await env.DB.prepare(
    "SELECT slug, SUM(n) AS views FROM views_daily WHERE day >= ?1 GROUP BY slug ORDER BY views DESC, slug LIMIT ?2",
  )
    .bind(since, limit)
    .all();
  return results;
}

// ---------- Polls ----------

async function pollCounts(env, poll) {
  const { results } = await env.DB.prepare(
    "SELECT option, COUNT(*) AS n FROM poll_votes WHERE poll = ?1 GROUP BY option",
  )
    .bind(poll)
    .all();
  return Object.fromEntries(results.map((r) => [r.option, r.n]));
}

// True once a poll's voting time (set in the dashboard) has passed. Polls without
// one stay open; if the dashboard can't be reached the vote is allowed.
async function pollClosed(env, poll) {
  try {
    const query = `?query=${encodeURIComponent('*[_type == "poll" && _id == $id][0].closesAt')}&%24id=${encodeURIComponent(JSON.stringify(poll))}`;
    const at = (await sanity(env, "query", { query })).result;
    return typeof at === "string" && Date.parse(at) <= Date.now();
  } catch {
    return false;
  }
}

// ---------- Ratings ----------

async function allRatings(env) {
  const { results } = await env.DB.prepare(
    "SELECT story, episode, AVG(value) AS avg, COUNT(*) AS n FROM ratings GROUP BY story, episode",
  ).all();
  const out = {};
  for (const r of results) {
    out[r.story] ??= {};
    out[r.story][r.episode] = { avg: Math.round(r.avg * 10) / 10, n: r.n };
  }
  return out;
}

// ---------- Comments ----------

async function sanity(env, path, init = {}) {
  const res = await fetch(
    `https://${env.SANITY_PROJECT}.api.sanity.io/v2025-02-19/data/${path}/${env.SANITY_DATASET}${init.query ?? ""}`,
    {
      method: init.method ?? "GET",
      headers: { Authorization: `Bearer ${env.SANITY_TOKEN}`, "Content-Type": "application/json" },
      body: init.body,
    },
  );
  if (!res.ok) throw new Error(`Sanity ${res.status}: ${await res.text()}`);
  return res.json();
}

async function addComment(env, data) {
  const target = String(data.target ?? "");
  const kind = data.kind === "story" ? "story" : "article";
  const name = clean(data.name, 60);
  const text = clean(data.text, 1000);
  const parent = data.parent ? String(data.parent) : "";
  if (!SLUG.test(target) || !name || !text) return { error: "invalid" };
  if (parent && !DOC_ID.test(parent)) return { error: "invalid" };

  // Link the comment to its article, so the dashboard shows which article it is on.
  const query = `?query=${encodeURIComponent(
    `*[_type == $kind && slug.current == $slug && !(_id in path("drafts.**"))][0]._id`,
  )}&%24kind=${encodeURIComponent(JSON.stringify(kind))}&%24slug=${encodeURIComponent(JSON.stringify(target))}`;
  const found = await sanity(env, "query", { query }).catch(() => null);
  const ref = found?.result;

  const id = crypto.randomUUID();
  const doc = {
    _id: `drafts.${id}`,
    _type: "comment",
    name,
    text,
    target,
    kind,
    ...(ref ? { post: { _type: "reference", _ref: ref, _weak: true } } : {}),
    ...(parent ? { parent } : {}),
    submittedAt: new Date().toISOString(),
  };
  await sanity(env, "mutate", { method: "POST", body: JSON.stringify({ mutations: [{ create: doc }] }) });
  return { ok: true, id };
}

async function likeCounts(env, ids) {
  if (!ids.length) return {};
  const marks = ids.map((_, i) => `?${i + 1}`).join(",");
  const { results } = await env.DB.prepare(
    `SELECT comment, SUM(value = 1) AS up, SUM(value = -1) AS down FROM comment_votes WHERE comment IN (${marks}) GROUP BY comment`,
  )
    .bind(...ids)
    .all();
  return Object.fromEntries(results.map((r) => [r.comment, { up: r.up, down: r.down }]));
}

// ---------- Router ----------

async function handle(request, env) {
  const h = cors(request, env);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const q = url.searchParams;

  if (request.method === "GET") {
    if (path === "/" || path === "/health") return json({ ok: true }, 200, h);
    if (path === "/views") {
      const slugs = (q.get("slugs") ?? "").split(",").filter((s) => SLUG.test(s)).slice(0, 60);
      if (!slugs.length) return json({}, 200, h);
      const marks = slugs.map((_, i) => `?${i + 1}`).join(",");
      const { results } = await env.DB.prepare(`SELECT slug, n FROM views WHERE slug IN (${marks})`)
        .bind(...slugs)
        .all();
      return json(Object.fromEntries(results.map((r) => [r.slug, r.n])), 200, h, 30);
    }
    if (path === "/top") {
      const days = Math.min(Math.max(Number(q.get("days")) || 7, 1), 60);
      const limit = Math.min(Math.max(Number(q.get("limit")) || 8, 1), 40);
      return json(await topViewed(env, days, limit), 200, h, 60);
    }
    if (path === "/poll") {
      const id = q.get("id") ?? "";
      if (!DOC_ID.test(id)) return json({ error: "invalid" }, 400, h);
      return json(await pollCounts(env, id), 200, h, 10);
    }
    if (path === "/ratings") return json(await allRatings(env), 200, h, 30);
    if (path === "/likes") {
      const ids = (q.get("ids") ?? "").split(",").filter((s) => DOC_ID.test(s)).slice(0, 100);
      return json(await likeCounts(env, ids), 200, h, 10);
    }
    return json({ error: "not found" }, 404, h);
  }

  if (request.method !== "POST") return json({ error: "method" }, 405, h);
  const data = await body(request);
  if (!data || typeof data !== "object") return json({ error: "invalid" }, 400, h);
  const who = await reader(request, env);
  const action = { "/view": "view", "/vote": "vote", "/rate": "rate", "/like": "like", "/comment": "comment" }[path];
  if (!action) return json({ error: "not found" }, 404, h);
  if (!(await allow(env, who, action))) return json({ error: "slow down" }, 429, h);

  if (action === "view") {
    const slug = String(data.slug ?? "");
    if (!SLUG.test(slug)) return json({ error: "invalid" }, 400, h);
    // Counted once per device per day. Many readers in the Maldives share one internet
    // address, so the device's own id is used, with the address only as a fallback.
    const device = VOTER.test(String(data.voter ?? "")) ? `d:${data.voter}` : `a:${who}`;
    return json({ views: await addView(env, device, slug) }, 200, h);
  }

  if (action === "vote") {
    const poll = String(data.poll ?? "");
    const option = Number(data.option);
    const voter = String(data.voter ?? "");
    if (!DOC_ID.test(poll) || !Number.isInteger(option) || option < 0 || option > 20 || !VOTER.test(voter))
      return json({ error: "invalid" }, 400, h);
    if (await pollClosed(env, poll)) return json({ error: "closed", counts: await pollCounts(env, poll) }, 403, h);
    const res = await env.DB.prepare("INSERT OR IGNORE INTO poll_votes (poll, voter, option) VALUES (?1, ?2, ?3)")
      .bind(poll, voter, option)
      .run();
    return json({ counts: await pollCounts(env, poll), already: !res.meta.changes }, 200, h);
  }

  if (action === "rate") {
    const story = String(data.story ?? "");
    const episode = Number(data.episode);
    const value = Number(data.value);
    const voter = String(data.voter ?? "");
    if (!SLUG.test(story) || !Number.isInteger(episode) || episode < 1 || episode > 500 || ![1, 2, 3, 4, 5].includes(value) || !VOTER.test(voter))
      return json({ error: "invalid" }, 400, h);
    await env.DB.prepare(
      "INSERT INTO ratings (story, episode, voter, value) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(story, episode, voter) DO UPDATE SET value = ?4",
    )
      .bind(story, episode, voter, value)
      .run();
    return json({ ok: true }, 200, h);
  }

  if (action === "like") {
    const comment = String(data.comment ?? "");
    const value = Number(data.value);
    const voter = String(data.voter ?? "");
    if (!DOC_ID.test(comment) || ![-1, 0, 1].includes(value) || !VOTER.test(voter))
      return json({ error: "invalid" }, 400, h);
    if (value === 0) {
      await env.DB.prepare("DELETE FROM comment_votes WHERE comment = ?1 AND voter = ?2").bind(comment, voter).run();
    } else {
      await env.DB.prepare(
        "INSERT INTO comment_votes (comment, voter, value) VALUES (?1, ?2, ?3) ON CONFLICT(comment, voter) DO UPDATE SET value = ?3",
      )
        .bind(comment, voter, value)
        .run();
    }
    return json((await likeCounts(env, [comment]))[comment] ?? { up: 0, down: 0 }, 200, h);
  }

  // Comment. "website" is a hidden form field only robots fill in.
  if (data.website) return json({ ok: true }, 200, h);
  if (!env.SANITY_TOKEN) return json({ error: "comments are not set up" }, 503, h);
  const result = await addComment(env, data);
  return json(result, result.error ? 400 : 200, h);
}

const worker = {
  async fetch(request, env) {
    try {
      return await handle(request, env);
    } catch (err) {
      console.error(err);
      return json({ error: "server" }, 500, cors(request, env));
    }
  },
  // Daily tidy-up: yesterday's "already counted" marks and old flood counters.
  async scheduled(_event, env) {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM seen WHERE day < ?1").bind(today()),
      env.DB.prepare("DELETE FROM hits"),
    ]);
  },
};

export default worker;
