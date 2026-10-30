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
const LIMITS = { view: 600, vote: 60, rate: 120, like: 300, comment: 6, voiceDenied: 60 };

// Days are counted in Maldives time (UTC+5), so "today" starts at local midnight.
const MV_MS = 5 * 3600000;
const mvDay = (ms) => new Date(ms + MV_MS).toISOString().slice(0, 10);
const today = () => mvDay(Date.now());
const hour = () => new Date().toISOString().slice(0, 13);

function cors(request, env) {
  const origin = request.headers.get("Origin") ?? "";
  const allowed = (env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim());
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0] ?? "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
    // Answers are data only: never to be guessed into another type, and the reader's
    // page address isn't passed on from here.
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
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

// ---------- Voice training (private) ----------
// The editor's voice recordings, kept to train a voice that reads articles aloud. Only
// the CMS administrator can reach them: every request carries their Sanity login, which
// Sanity itself confirms. The sound is stored in pieces, as database rows have a size limit.

const VOICE_KEY = /^[a-f0-9]{8,32}$/;
const VOICE_PART = 900000;
const VOICE_MAX = 20000000;
// Logins already confirmed (by a hash of the login, never the login itself), so playing
// through the list doesn't ask Sanity every time.
const voiceAdmins = new Map();

function bearer(request) {
  const auth = request.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  return token && token.length <= 500 ? token : "";
}

// An administrator login this service already confirmed recently.
async function knownAdmin(request) {
  const token = bearer(request);
  return Boolean(token) && (voiceAdmins.get(await sha256(token)) ?? 0) > Date.now();
}

async function voiceAdmin(request, env) {
  const token = bearer(request);
  if (!token) return false;
  const id = await sha256(token);
  if ((voiceAdmins.get(id) ?? 0) > Date.now()) return true;
  try {
    const res = await fetch(`https://${env.SANITY_PROJECT}.api.sanity.io/v2021-06-07/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const me = await res.json();
    const ok = Boolean(me?.id) && (me.roles ?? []).some((r) => r?.name === "administrator");
    if (ok) voiceAdmins.set(id, Date.now() + 10 * 60000);
    return ok;
  } catch {
    return false;
  }
}

async function voice(request, env, path, h) {
  // Refused logins are counted per reader: past the hourly limit, the next tries are
  // turned away before asking Sanity, so nobody can keep guessing (or keep this service
  // busy asking Sanity). Each refusal is noted in the service's logs. The administrator,
  // once confirmed, always gets in (many readers share one address).
  const who = await reader(request, env);
  const denied = await env.DB.prepare("SELECT n FROM hits WHERE key = ?1").bind(`voiceDenied|${who}|${hour()}`).first();
  if ((denied?.n ?? 0) >= LIMITS.voiceDenied && !(await knownAdmin(request))) {
    console.warn(JSON.stringify({ event: "voice-denied", reader: who, path, limited: true }));
    return json({ error: "slow down" }, 429, h);
  }
  if (!(await voiceAdmin(request, env))) {
    await allow(env, who, "voiceDenied");
    console.warn(JSON.stringify({ event: "voice-denied", reader: who, path }));
    return json({ error: "not allowed" }, 403, h);
  }
  const key = new URL(request.url).searchParams.get("key") ?? "";

  if (request.method === "GET" && path === "/voice/clips") {
    const { results } = await env.DB.prepare("SELECT key, text, seconds, bytes FROM voice_clips ORDER BY at").all();
    return json(results, 200, h);
  }
  if (request.method === "GET" && path === "/voice/audio") {
    if (!VOICE_KEY.test(key)) return json({ error: "invalid" }, 400, h);
    const { results } = await env.DB.prepare("SELECT data FROM voice_parts WHERE key = ?1 ORDER BY part").bind(key).all();
    if (!results.length) return json({ error: "not found" }, 404, h);
    const sound = new Blob(results.map((r) => new Uint8Array(r.data)));
    return new Response(sound, { headers: { ...h, "Content-Type": "audio/wav", "Cache-Control": "private, no-store" } });
  }
  if (request.method === "POST" && path === "/voice/clip") {
    const form = await request.formData().catch(() => null);
    const audio = form?.get("audio");
    const id = String(form?.get("key") ?? "");
    const text = clean(form?.get("text"), 400);
    const seconds = Number(form?.get("seconds"));
    if (!VOICE_KEY.test(id) || !text || !(seconds > 0 && seconds <= 300) || typeof audio === "string" || !audio)
      return json({ error: "invalid" }, 400, h);
    const bytes = new Uint8Array(await audio.arrayBuffer());
    if (!bytes.length || bytes.length > VOICE_MAX) return json({ error: "invalid" }, 400, h);
    const steps = [
      env.DB.prepare("DELETE FROM voice_parts WHERE key = ?1").bind(id),
      env.DB.prepare("INSERT OR REPLACE INTO voice_clips (key, text, seconds, bytes, at) VALUES (?1, ?2, ?3, ?4, ?5)").bind(
        id,
        text,
        seconds,
        bytes.length,
        Date.now(),
      ),
    ];
    for (let at = 0, part = 0; at < bytes.length; at += VOICE_PART, part++) {
      steps.push(
        env.DB.prepare("INSERT INTO voice_parts (key, part, data) VALUES (?1, ?2, ?3)").bind(id, part, bytes.slice(at, at + VOICE_PART)),
      );
    }
    await env.DB.batch(steps);
    return json({ ok: true, bytes: bytes.length }, 200, h);
  }
  if (request.method === "POST" && path === "/voice/delete") {
    if (!VOICE_KEY.test(key)) return json({ error: "invalid" }, 400, h);
    await env.DB.batch([
      env.DB.prepare("DELETE FROM voice_parts WHERE key = ?1").bind(key),
      env.DB.prepare("DELETE FROM voice_clips WHERE key = ?1").bind(key),
    ]);
    return json({ ok: true }, 200, h);
  }
  return json({ error: "not found" }, 404, h);
}

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
  const since = mvDay(Date.now() - days * 86400000);
  const { results } = await env.DB.prepare(
    "SELECT slug, SUM(n) AS views FROM views_daily WHERE day >= ?1 GROUP BY slug ORDER BY views DESC, slug LIMIT ?2",
  )
    .bind(since, limit)
    .all();
  return results;
}

// ---------- Dashboard ----------

// Numbers for the editors' dashboard: views per day for 30 days, views per article
// this week and this month, and poll votes. All of it is counts the site shows anyway.
async function dashboardStats(env) {
  const day = (back) => mvDay(Date.now() - back * 86400000);
  const [daily, week, month, polls] = await env.DB.batch([
    env.DB.prepare("SELECT day, SUM(n) AS n FROM views_daily WHERE day >= ?1 GROUP BY day ORDER BY day").bind(day(29)),
    env.DB.prepare("SELECT slug, SUM(n) AS n FROM views_daily WHERE day >= ?1 GROUP BY slug").bind(day(6)),
    env.DB.prepare("SELECT slug, SUM(n) AS n FROM views_daily WHERE day >= ?1 GROUP BY slug").bind(day(29)),
    env.DB.prepare("SELECT poll, option, COUNT(*) AS n FROM poll_votes GROUP BY poll, option"),
  ]);
  const bySlug = (rows) => Object.fromEntries(rows.results.map((r) => [r.slug, r.n]));
  const pollVotes = {};
  for (const r of polls.results) (pollVotes[r.poll] ??= {})[r.option] = r.n;
  return {
    today: day(0),
    daily: daily.results.map((r) => ({ day: r.day, n: r.n })),
    week: bySlug(week),
    month: bySlug(month),
    polls: pollVotes,
  };
}

// Readers from Cloudflare Web Analytics, fetched hourly and kept in a private
// dashboard record ("analytics.readers": ids with a dot are hidden from the public).
const SITE_HOSTS = ["gassaan.github.io", "hulhangu.com", "www.hulhangu.com"];

async function cloudflare(env, query) {
  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.CF_ANALYTICS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.errors?.length) {
    throw new Error(data?.errors?.map((e) => e.message).join("; ") || `HTTP ${res.status}`);
  }
  return data.data.viewer.accounts[0] ?? {};
}

async function readerStats(env) {
  const now = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  const week = `datetime_geq: "${iso(now - 7 * 86400000)}", datetime_lt: "${iso(now)}"`;
  const prev = `datetime_geq: "${iso(now - 14 * 86400000)}", datetime_lt: "${iso(now - 7 * 86400000)}"`;
  const hosts = `requestHost_in: ${JSON.stringify(SITE_HOSTS)}`;
  const acct = JSON.stringify(env.CF_ACCOUNT_ID);
  const wrap = (inner) => `{ viewer { accounts(filter: { accountTag: ${acct} }) { ${inner} } } }`;
  const group = (name, dim) =>
    `${name}: rumPageloadEventsAdaptiveGroups(limit: 8, orderBy: [count_DESC], filter: { ${week}, ${hosts} }) { count sum { visits } dimensions { ${dim} } }`;

  const out = { fetchedAt: iso(now), errors: {} };
  const parts = {
    totals: wrap(
      `week: rumPageloadEventsAdaptiveGroups(limit: 1, filter: { ${week}, ${hosts} }) { count sum { visits } } ` +
        `prev: rumPageloadEventsAdaptiveGroups(limit: 1, filter: { ${prev}, ${hosts} }) { count sum { visits } }`,
    ),
    referrers: wrap(group("rows", "refererHost")),
    countries: wrap(group("rows", "countryName")),
    devices: wrap(group("rows", "deviceType")),
    speed: wrap(
      `rows: rumWebVitalsEventsAdaptiveGroups(limit: 1, filter: { ${week}, ${hosts} }) { count sum { lcpGood lcpNeedsImprovement lcpPoor } }`,
    ),
  };
  for (const [key, query] of Object.entries(parts)) {
    try {
      const a = await cloudflare(env, query);
      if (key === "totals") {
        out.totals = {
          views: a.week?.[0]?.count ?? 0,
          visits: a.week?.[0]?.sum?.visits ?? 0,
          prevViews: a.prev?.[0]?.count ?? 0,
          prevVisits: a.prev?.[0]?.sum?.visits ?? 0,
        };
      } else if (key === "speed") {
        out.speed = a.rows?.[0]?.sum ?? null;
      } else {
        out[key] = (a.rows ?? []).map((r) => ({
          name: Object.values(r.dimensions ?? {})[0] || "",
          views: r.count,
          visits: r.sum?.visits ?? 0,
        }));
      }
    } catch (err) {
      out.errors[key] = String(err.message ?? err).slice(0, 300);
    }
  }
  await sanity(env, "mutate", {
    method: "POST",
    body: JSON.stringify({
      mutations: [{ createOrReplace: { _id: "analytics.readers", _type: "siteAnalytics", data: JSON.stringify(out) } }],
    }),
  });
  return out;
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
  if (path.startsWith("/voice/")) return voice(request, env, path, h);

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
    if (path === "/stats") return json(await dashboardStats(env), 200, h, 60);
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
  if (!(await allow(env, who, action))) {
    console.warn(JSON.stringify({ event: "rate-limited", reader: who, action }));
    return json({ error: "slow down" }, 429, h);
  }

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

const DAILY_CRON = "17 3 * * *";

const worker = {
  async fetch(request, env) {
    try {
      return await handle(request, env);
    } catch (err) {
      console.error(err);
      return json({ error: "server" }, 500, cors(request, env));
    }
  },
  async scheduled(event, env) {
    // Hourly: refresh the readers numbers for the dashboard, once Cloudflare is set up.
    if (event.cron !== DAILY_CRON) {
      if (env.CF_ANALYTICS_TOKEN && env.CF_ACCOUNT_ID && env.SANITY_TOKEN) await readerStats(env);
      return;
    }
    // Daily tidy-up: yesterday's "already counted" marks and old flood counters.
    await env.DB.batch([
      env.DB.prepare("DELETE FROM seen WHERE day < ?1").bind(today()),
      env.DB.prepare("DELETE FROM hits"),
    ]);
  },
};

export default worker;
