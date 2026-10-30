// Security tests for the online service: each one tries to break a protection and
// checks it holds. Runs the real service code against a throwaway in-memory database
// and a stand-in for Sanity, so it never touches live data.
//   npm test   (in api/)

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";

const HERE = new URL(".", import.meta.url).pathname;
const db = new DatabaseSync(":memory:");
for (const f of fs.readdirSync(`${HERE}../migrations`).sort()) db.exec(fs.readFileSync(`${HERE}../migrations/${f}`, "utf8"));

// The parts of Cloudflare's D1 the service uses.
class Stmt {
  constructor(sql, args = []) {
    this.sql = sql; // numbered ?1, ?2 … as D1 takes them (SQLite does too)
    this.args = args;
  }
  bind(...a) {
    return new Stmt(this.sql, a);
  }
  run() {
    db.prepare(this.sql).run(...this.args);
    return { success: true };
  }
  all() {
    const rows = db.prepare(this.sql).all(...this.args);
    return { results: rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v instanceof Uint8Array ? [...v] : v]))) };
  }
  first() {
    return db.prepare(this.sql).get(...this.args) ?? null;
  }
}
const env = {
  SANITY_PROJECT: "test",
  SANITY_DATASET: "production",
  SANITY_TOKEN: "test-token",
  ALLOWED_ORIGINS: "https://gassaan.github.io",
  DB: {
    prepare: (s) => new Stmt(s),
    batch: async (list) => {
      db.exec("BEGIN");
      try {
        const r = list.map((s) => (/^\s*select/i.test(s.sql) ? s.all() : s.run()));
        db.exec("COMMIT");
        return r;
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    },
  },
};

// Stand-in Sanity: "admin" is the project administrator, "editor" an editor, anything else nobody.
let sanityCalls = 0;
const writes = [];
globalThis.fetch = async (url, init = {}) => {
  sanityCalls++;
  const u = String(url);
  if (u.includes("/users/me")) {
    const t = (init.headers?.Authorization ?? "").slice(7);
    const me = t === "admin" ? { id: "u1", roles: [{ name: "administrator" }] } : t === "editor" ? { id: "u2", roles: [{ name: "editor" }] } : {};
    return new Response(JSON.stringify(me));
  }
  if (u.includes("/data/mutate")) writes.push(init.body);
  return new Response(JSON.stringify({ result: null }));
};
console.warn = () => {};
console.error = () => {};

const worker = (await import(`${HERE}../src/index.js`)).default;
const SITE = "https://gassaan.github.io";
const call = (path, { method = "GET", token, body, ip = "198.51.100.7", origin = SITE } = {}) =>
  worker.fetch(
    new Request(`https://api.test${path}`, {
      method,
      body,
      headers: { Origin: origin, "CF-Connecting-IP": ip, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    }),
    env,
  );
const post = (path, data, opts = {}) => call(path, { method: "POST", body: typeof data === "string" ? data : JSON.stringify(data), ...opts });

let failed = 0;
const check = (ok, what) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${what}`);
  if (!ok) failed++;
};

// --- Every answer
const health = await call("/health");
check(health.headers.get("x-content-type-options") === "nosniff" && health.headers.get("referrer-policy") === "no-referrer", "protective headers on every answer");
const other = await call("/health", { origin: "https://evil.example" });
check(other.headers.get("access-control-allow-origin") === SITE, "other websites are not allowed to use the service");

// --- Input checks
check((await post("/view", { slug: "../../etc" })).status === 400, "a bad article address is refused");
check((await post("/vote", { poll: "p1", option: -3, voter: "a".repeat(20) })).status === 400, "a negative poll option is refused");
check((await post("/comment", { target: "article-1", name: "", text: "hi" })).status === 400, "a comment without a name is refused");
check((await post("/comment", "x".repeat(9000))).status === 400, "an oversized message is refused");
check((await post("/comment", "{not json")).status === 400, "broken data is refused");
const sneaky = await post("/comment", { target: "article-1", name: "Ali", text: "hello", _id: "featuredArticles", role: "admin" });
check(sneaky.status === 200 && writes.length === 1 && !writes[0].includes("featuredArticles") && !writes[0].includes('"role"'), "extra fields in a comment are ignored, and it goes in as an unpublished draft");
check(writes[0].includes('"_id":"drafts.'), "new comments wait for an editor (drafts)");

// --- Comment reactions: one per device, five kinds, nothing else
const voter = "device-0123456789abcdef";
const react = (value, v = voter) => post("/like", { comment: "c-1", value, voter: v });
check((await react(7)).status === 400, "reactions: an unknown reaction is refused");
await react(1);
await react(2, "device-2222222222222222");
let counts = await (await react(4, "device-3333333333333333")).json();
check(counts.up === 1 && counts.love === 1 && counts.haha === 1 && counts.down === 0, "reactions: like, love and haha are counted");
counts = await (await react(3)).json();
check(counts.up === 0 && counts.sad === 1, "reactions: changing yours moves it, one per device");
counts = await (await react(0)).json();
check(counts.sad === 0 && counts.love === 1, "reactions: taking yours back removes it");

// --- Abuse limits
let last;
for (let i = 0; i < 8; i++) last = await post("/comment", { target: "article-1", name: "Spam", text: `spam ${i}` }, { ip: "203.0.113.50" });
check(last.status === 429, "more than 6 comments an hour from one reader are refused");

// --- Voice recordings (administrator only)
check((await call("/voice/clips")).status === 403, "recordings: refused without a login");
check((await call("/voice/clips", { token: "editor" })).status === 403, "recordings: refused for an editor");
check((await call("/voice/clips", { token: "admin" })).status === 200, "recordings: open to the administrator");
const form = new FormData();
form.set("key", "aabbccddeeff");
form.set("text", "test");
form.set("seconds", "2");
form.set("audio", new Blob([new Uint8Array(1000)]), "a.wav");
check((await call("/voice/clip", { method: "POST", body: form, token: "editor" })).status === 403, "recordings: an editor can't add one");
const badKey = new FormData();
badKey.set("key", "../x");
badKey.set("text", "t");
badKey.set("seconds", "1");
badKey.set("audio", new Blob([new Uint8Array(10)]), "a.wav");
check((await call("/voice/clip", { method: "POST", body: badKey, token: "admin" })).status === 400, "recordings: a bad recording name is refused");
const before = sanityCalls;
for (let i = 0; i < 70; i++) last = await call("/voice/clips", { token: `guess${i}`, ip: "203.0.113.9" });
check(last.status === 429 && sanityCalls - before === 60, "recordings: after 60 refused logins an hour, guessing stops without asking Sanity");
check((await call("/voice/clips", { token: "admin", ip: "203.0.113.9" })).status === 200, "recordings: the administrator still gets in from a blocked address");

// --- Errors never show internals
const broken = await worker.fetch(new Request("https://api.test/stats", { headers: { Origin: SITE } }), { ...env, DB: null });
const text = await broken.text();
check(broken.status === 500 && !/at |\.js|TypeError|stack/i.test(text), "errors don't show internal details");

console.log(failed ? `\n${failed} check(s) failed` : "\nAll security checks passed");
process.exitCode = failed ? 1 : 0;
