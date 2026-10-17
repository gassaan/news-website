import { useEffect, useMemo, useState } from "react";
import { useClient } from "sanity";
import { IntentLink } from "sanity/router";
import { Card } from "@sanity/ui";
import { API_URL } from "../../lib/api";
import { SECTIONS } from "../../lib/sections";
import "./dashboard.css";

// The editors' dashboard: how the site is read (from the site's online service),
// what's waiting in the dashboard, and who the readers are (Cloudflare, fetched hourly).

type Article = { _id: string; slug: string; title: string; category: string; author: string | null };
type Story = { slug: string; title: string; author: string | null };
type Poll = { _id: string; title: string; options: string[] | null; closesAt?: string };
type Waiting = { _id: string; target?: string; _createdAt: string };
type Content = { articles: Article[]; stories: Story[]; polls: Poll[]; approved: { target?: string }[] };
type Stats = {
  today: string;
  daily: { day: string; n: number }[];
  week: Record<string, number>;
  month: Record<string, number>;
  polls: Record<string, Record<string, number>>;
};
type Ratings = Record<string, Record<string, { avg: number; n: number }>>;
type Row = { name: string; views: number; visits: number };
type Readers = {
  fetchedAt: string;
  totals?: { views: number; visits: number; prevViews: number; prevVisits: number };
  referrers?: Row[];
  countries?: Row[];
  devices?: Row[];
  speed?: { lcpGood?: number; lcpNeedsImprovement?: number; lcpPoor?: number } | null;
  errors: Record<string, string>;
};

const CONTENT = `{
  "articles": *[_type == "article" && defined(slug.current)]{ _id, "slug": slug.current, title, category, "author": author->title },
  "stories": *[_type == "story" && defined(slug.current)]{ "slug": slug.current, title, "author": author->title },
  "polls": *[_type == "poll"] | order(publishedAt desc){ _id, title, options, closesAt },
  "approved": *[_type == "comment"]{ target }
}`;
const WAITING = `*[_type == "comment" && _id in path("drafts.**")]{ _id, target, _createdAt } | order(_createdAt asc)`;
const READERS = `*[_id == "analytics.readers"][0].data`;

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const DAY = 86400000;
const shiftDay = (day: string, by: number) => new Date(Date.parse(`${day}T00:00:00Z`) + by * DAY).toISOString().slice(0, 10);
const shortDate = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

function ago(iso: string, now: number): string {
  const h = Math.max(0, (now - Date.parse(iso)) / 3600000);
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min ago`;
  if (h < 48) return `${Math.round(h)} hours ago`;
  return `${Math.round(h / 24)} days ago`;
}
function timeLeft(iso: string, now: number): string {
  const h = (Date.parse(iso) - now) / 3600000;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
  if (h < 48) return `${Math.round(h)} hours`;
  return `${Math.round(h / 24)} days`;
}

function Change({ now, before, label }: { now: number; before: number; label: string }) {
  if (!before) return <span className="hd-chip flat">{label}: no data yet</span>;
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return <span className="hd-chip flat">same as {label}</span>;
  return (
    <span className={`hd-chip ${pct > 0 ? "up" : "down"}`}>
      {pct > 0 ? "▲" : "▼"} {Math.abs(pct)}% vs {label}
    </span>
  );
}

function Bars({ rows, unit = "", thaana = true }: { rows: { name: string; value: number; link?: React.ReactNode }[]; unit?: string; thaana?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="hd-empty">Nothing to show yet.</p>;
  return (
    <div className="hd-rows">
      {rows.map((r, i) => (
        <div className="hd-row" key={`${r.name}-${i}`} title={`${r.name}: ${fmt(r.value)}${unit}`}>
          <span className={`hd-name${thaana ? " dv" : ""}`}>{r.link ?? r.name}</span>
          <span className="hd-track">
            <span className="hd-fill" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="hd-num">
            {fmt(r.value)}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

// Views per day: one area line with a touch/hover readout.
function Trend({ points }: { points: { day: string; n: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 340, H = 160, pl = 38, pr = 10, pt = 10, pb = 24;
  const top = Math.max(10, ...points.map((p) => p.n));
  const step = [10, 20, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 50000].find((s) => s * 4 >= top) ?? 100000;
  const yMax = step * 4;
  const x = (i: number) => pl + (i / Math.max(1, points.length - 1)) * (W - pl - pr);
  const y = (v: number) => pt + (1 - v / yMax) * (H - pt - pb);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.n).toFixed(1)}`).join(" ");
  const last = points.length - 1;
  const pick = (e: React.PointerEvent<SVGRectElement>) => {
    const r = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(last, Math.round(((px - pl) / (W - pl - pr)) * last))));
  };
  const h = hover !== null ? points[hover] : null;
  return (
    <div className="hd-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Views per day for the last ${points.length} days`}>
        {[0, 1, 2, 3, 4].map((k) => (
          <g key={k}>
            <line x1={pl} x2={W - pr} y1={y(step * k)} y2={y(step * k)} className="hd-grid" />
            <text x={pl - 6} y={y(step * k) + 3.5} textAnchor="end" className="hd-axis">
              {fmt(step * k)}
            </text>
          </g>
        ))}
        <path d={`${line} L${x(last)},${y(0)} L${x(0)},${y(0)} Z`} className="hd-area" />
        <path d={line} className="hd-line" />
        <circle cx={x(last)} cy={y(points[last].n)} r={4} className="hd-dot" />
        {[0, Math.floor(last / 2), last].map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"} className="hd-axis">
            {shortDate(points[i].day)}
          </text>
        ))}
        {h && hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pt} y2={y(0)} className="hd-cross" />
            <circle cx={x(hover)} cy={y(h.n)} r={4} className="hd-dot" />
          </g>
        )}
        <rect x={pl} y={pt} width={W - pl - pr} height={H - pt - pb} fill="transparent" onPointerMove={pick} onPointerDown={pick} onPointerLeave={() => setHover(null)} />
      </svg>
      {h && hover !== null && (
        <span className="hd-tip" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(h.n) / H) * 100}%` }}>
          {shortDate(h.day)} · {fmt(h.n)} views
        </span>
      )}
    </div>
  );
}

export default function Dashboard() {
  const client = useClient({ apiVersion: "2025-02-19" });
  const [tab, setTab] = useState<"overview" | "sections" | "readers">("overview");
  const [content, setContent] = useState<Content | null>(null);
  const [waiting, setWaiting] = useState<Waiting[]>([]);
  const [readers, setReaders] = useState<Readers | null | undefined>(undefined);
  const [stats, setStats] = useState<Stats | null>(null);
  const [ratings, setRatings] = useState<Ratings>({});
  const [failed, setFailed] = useState("");
  // The time the dashboard was opened; "ends in" and "ago" are counted from it.
  const [now] = useState(() => Date.now());

  useEffect(() => {
    client.fetch<Content>(CONTENT, {}, { perspective: "published" }).then(setContent, () => setFailed("content"));
    client.fetch<Waiting[]>(WAITING, {}, { perspective: "raw" }).then(setWaiting, () => {});
    client
      .fetch<string | null>(READERS, {}, { perspective: "raw" })
      .then((raw) => setReaders(raw ? (JSON.parse(raw) as Readers) : null), () => setReaders(null));
    if (API_URL) {
      fetch(`${API_URL}/stats`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then(setStats, () => setFailed("stats"));
      fetch(`${API_URL}/ratings`)
        .then((r) => (r.ok ? r.json() : {}))
        .then(setRatings, () => {});
    }
  }, [client]);

  const view = useMemo(() => {
    if (!content || !stats) return null;
    const bySlug = new Map(content.articles.map((a) => [a.slug, a]));
    const day = (d: string) => stats.daily.find((p) => p.day === d)?.n ?? 0;
    const points = Array.from({ length: 30 }, (_, i) => {
      const d = shiftDay(stats.today, i - 29);
      return { day: d, n: day(d) };
    });
    const sum = (from: number, to: number) => points.slice(from, to).reduce((n, p) => n + p.n, 0);
    const pollsOpen = content.polls.filter((p) => !p.closesAt || Date.parse(p.closesAt) > now);
    const votes = (p: Poll) => Object.values(stats.polls[p._id] ?? {}).reduce((a, b) => a + b, 0);

    const top = Object.entries(stats.week)
      .filter(([slug]) => bySlug.has(slug))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([slug, n]) => ({ article: bySlug.get(slug)!, n }));

    const sections = SECTIONS.map((s) => ({
      name: s.name,
      value: Object.entries(stats.week).reduce((n, [slug, v]) => n + (bySlug.get(slug)?.category === s.slug ? v : 0), 0),
    })).sort((a, b) => b.value - a.value);

    const comments = new Map<string, number>();
    for (const c of content.approved) if (c.target) comments.set(c.target, (comments.get(c.target) ?? 0) + 1);
    const writers = new Map<string, { articles: number; views: number; comments: number }>();
    for (const a of content.articles) {
      const name = a.author ?? "—";
      const w = writers.get(name) ?? { articles: 0, views: 0, comments: 0 };
      w.articles += 1;
      w.views += stats.month[a.slug] ?? 0;
      w.comments += comments.get(a.slug) ?? 0;
      writers.set(name, w);
    }

    const rated = content.stories
      .map((s) => {
        let total = 0, n = 0;
        for (const r of Object.values(ratings[s.slug] ?? {})) {
          total += r.avg * r.n;
          n += r.n;
        }
        return { ...s, avg: n ? total / n : 0, n };
      })
      .filter((s) => s.n > 0)
      .sort((a, b) => b.avg - a.avg || b.n - a.n)
      .slice(0, 5);

    const titleOf = (slug?: string) => (slug ? bySlug.get(slug)?.title : undefined);
    const waitingOn = new Set(waiting.map((w) => w.target).filter(Boolean)).size;

    return {
      points,
      today: day(stats.today),
      yesterday: day(shiftDay(stats.today, -1)),
      week: sum(23, 30),
      lastWeek: sum(16, 23),
      pollsOpen,
      votesOpen: pollsOpen.reduce((n, p) => n + votes(p), 0),
      votes,
      top,
      sections,
      writers: [...writers.entries()].sort((a, b) => b[1].views - a[1].views),
      rated,
      titleOf,
      waitingOn,
      endingSoon: pollsOpen.filter((p) => p.closesAt && Date.parse(p.closesAt) - now < 2 * DAY),
    };
  }, [content, stats, ratings, waiting, now]);

  const tabs = (
    <div className="hd-tabs" role="tablist">
      {(
        [
          ["overview", "Overview"],
          ["sections", "Sections & writers"],
          ["readers", "Readers"],
        ] as const
      ).map(([id, label]) => (
        <button key={id} type="button" role="tab" aria-selected={tab === id} className={`hd-tab${tab === id ? " on" : ""}`} onClick={() => setTab(id)}>
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <Card height="fill" overflow="auto" className="hd">
      <div className="hd-page">
        <h1 className="hd-title">Dashboard</h1>
        {tabs}

        {!API_URL && <p className="hd-note">The site&apos;s online service isn&apos;t connected, so there are no numbers to show.</p>}
        {failed && <p className="hd-note">Couldn&apos;t load the {failed === "stats" ? "view numbers" : "content list"}. Check your connection and open the dashboard again.</p>}
        {API_URL && !failed && !view && tab !== "readers" && <p className="hd-note">Loading…</p>}

        {view && tab === "overview" && (
          <>
            <div className="hd-kpis">
              <div className="hd-kpi">
                <span className="hd-label">Views today</span>
                <span className="hd-value">{fmt(view.today)}</span>
                {/* The day isn't over yet, so show yesterday's full day for scale rather than a change. */}
                <span className="hd-chip flat">Yesterday: {fmt(view.yesterday)}</span>
              </div>
              <div className="hd-kpi">
                <span className="hd-label">Views this week</span>
                <span className="hd-value">{fmt(view.week)}</span>
                <Change now={view.week} before={view.lastWeek} label="last week" />
              </div>
              <div className="hd-kpi">
                <span className="hd-label">Comments waiting</span>
                <span className="hd-value">{waiting.length}</span>
                {waiting.length ? <span className="hd-chip attn">Needs approval</span> : <span className="hd-chip up">All approved</span>}
              </div>
              <div className="hd-kpi">
                <span className="hd-label">Votes on open polls</span>
                <span className="hd-value">{fmt(view.votesOpen)}</span>
                <span className="hd-chip flat">
                  {view.pollsOpen.length} poll{view.pollsOpen.length === 1 ? "" : "s"} open
                </span>
              </div>
            </div>

            <section className="hd-card">
              <h2>
                Daily views <small>last 30 days</small>
              </h2>
              <Trend points={view.points} />
            </section>

            <section className="hd-card">
              <h2>
                Most read this week <small>views</small>
              </h2>
              <Bars
                rows={view.top.map(({ article, n }) => ({
                  name: article.title,
                  value: n,
                  link: (
                    <IntentLink intent="edit" params={{ id: article._id, type: "article" }} className="hd-link">
                      {article.title}
                    </IntentLink>
                  ),
                }))}
              />
            </section>

            <section className="hd-card">
              <h2>Needs your attention</h2>
              <div className="hd-todo">
                {waiting.length > 0 && (
                  <div className="hd-todo-item">
                    <span className="hd-mark" />
                    <span className="hd-what">
                      <b>
                        {waiting.length} comment{waiting.length === 1 ? "" : "s"} waiting
                      </b>
                      On {view.waitingOn} article{view.waitingOn === 1 ? "" : "s"}, oldest {ago(waiting[0]._createdAt, now)}
                    </span>
                    <IntentLink intent="edit" params={{ id: waiting[0]._id.replace(/^drafts\./, ""), type: "comment" }} className="hd-btn">
                      Review
                    </IntentLink>
                  </div>
                )}
                {view.endingSoon.map((p) => (
                  <div className="hd-todo-item" key={p._id}>
                    <span className="hd-mark" />
                    <span className="hd-what">
                      <b>Poll ends in {timeLeft(p.closesAt!, now)}</b>
                      <span className="dv">{p.title}</span>
                    </span>
                    <IntentLink intent="edit" params={{ id: p._id, type: "poll" }} className="hd-btn">
                      Open
                    </IntentLink>
                  </div>
                ))}
                {!waiting.length && !view.endingSoon.length && <p className="hd-empty">Nothing needs you right now.</p>}
              </div>
            </section>
          </>
        )}

        {view && tab === "sections" && (
          <>
            <section className="hd-card">
              <h2>
                Views by section <small>this week</small>
              </h2>
              <Bars rows={view.sections} />
            </section>

            <section className="hd-card">
              <h2>
                Writers <small>views in the last 30 days</small>
              </h2>
              <div className="hd-scroll">
                <table className="hd-table">
                  <thead>
                    <tr>
                      <th>Writer</th>
                      <th className="n">Articles</th>
                      <th className="n">Views</th>
                      <th className="n">Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.writers.map(([name, w]) => (
                      <tr key={name}>
                        <td className="dv">{name}</td>
                        <td className="n">{fmt(w.articles)}</td>
                        <td className="n">{fmt(w.views)}</td>
                        <td className="n">{fmt(w.comments)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="hd-card">
              <h2>
                Best-rated stories <small>all episodes</small>
              </h2>
              {view.rated.length ? (
                <div className="hd-stories">
                  {view.rated.map((s) => (
                    <div className="hd-story" key={s.slug}>
                      <span className="hd-rate">★ {s.avg.toFixed(1)}</span>
                      <span className="hd-story-t">
                        <span className="dv">{s.title}</span>
                        <small>
                          {fmt(s.n)} rating{s.n === 1 ? "" : "s"}
                        </small>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="hd-empty">No story has been rated yet.</p>
              )}
            </section>

            {(view.pollsOpen.length ? view.pollsOpen.slice(0, 2) : content!.polls.slice(0, 1)).map((p) => {
              const counts = stats!.polls[p._id] ?? {};
              const total = view.votes(p);
              return (
                <section className="hd-card" key={p._id}>
                  <h2>
                    {p.closesAt && Date.parse(p.closesAt) <= now ? "Latest poll (ended)" : "Live poll"}
                    <small>{!p.closesAt ? "no end time" : Date.parse(p.closesAt) > now ? `ends in ${timeLeft(p.closesAt, now)}` : "ended"}</small>
                  </h2>
                  <p className="hd-poll-q dv">{p.title}</p>
                  <Bars rows={(p.options ?? []).map((o, i) => ({ name: o, value: total ? Math.round(((counts[i] ?? 0) / total) * 100) : 0 }))} unit="%" />
                  <p className="hd-small">{fmt(total)} votes</p>
                </section>
              );
            })}
          </>
        )}

        {tab === "readers" && <ReadersTab readers={readers} now={now} />}
      </div>
    </Card>
  );
}

function ReadersTab({ readers, now }: { readers: Readers | null | undefined; now: number }) {
  if (readers === undefined) return <p className="hd-note">Loading…</p>;
  if (readers === null)
    return (
      <section className="hd-card">
        <h2>Readers aren&apos;t connected yet</h2>
        <p className="hd-small">
          This tab shows visits, where readers come from, countries, phones vs computers and page speed from Cloudflare Web Analytics. It needs a read-only
          Cloudflare key saved in GitHub as <b>CLOUDFLARE_ANALYTICS_TOKEN</b>. After that, the numbers arrive within the hour and refresh every hour.
        </p>
      </section>
    );
  const t = readers.totals;
  const own = new Set(["gassaan.github.io", "hulhangu.com", "www.hulhangu.com"]);
  const referrers = (readers.referrers ?? [])
    .filter((r) => !own.has(r.name))
    .map((r) => ({ name: r.name ? r.name.replace(/^(www\.|m\.|l\.|lm\.)/, "") : "Direct (typed or saved)", value: r.visits || r.views }));
  // Cloudflare may give two-letter country codes ("MV"): show the name ("Maldives").
  const regions = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(["en"], { type: "region" }) : null;
  const country = (c: string) => (/^[A-Z]{2}$/.test(c) && regions ? (regions.of(c) ?? c) : c);
  const countries = (readers.countries ?? []).map((r) => ({ name: r.name ? country(r.name) : "Unknown", value: r.visits || r.views }));
  const devices = readers.devices ?? [];
  const deviceTotal = devices.reduce((n, d) => n + (d.visits || d.views), 0);
  const phones = devices.filter((d) => /mobile|phone|tablet/i.test(d.name)).reduce((n, d) => n + (d.visits || d.views), 0);
  const phonePct = deviceTotal ? Math.round((phones / deviceTotal) * 100) : null;
  const s = readers.speed;
  const speedTotal = s ? (s.lcpGood ?? 0) + (s.lcpNeedsImprovement ?? 0) + (s.lcpPoor ?? 0) : 0;
  const goodPct = s && speedTotal ? Math.round(((s.lcpGood ?? 0) / speedTotal) * 100) : null;
  const errors = Object.entries(readers.errors ?? {});

  return (
    <>
      <p className="hd-small">Last 7 days, updated {ago(readers.fetchedAt, now)}.</p>
      {t && (
        <div className="hd-kpis">
          <div className="hd-kpi">
            <span className="hd-label">Visits this week</span>
            <span className="hd-value">{fmt(t.visits)}</span>
            <Change now={t.visits} before={t.prevVisits} label="last week" />
          </div>
          <div className="hd-kpi">
            <span className="hd-label">Pages per visit</span>
            <span className="hd-value">{t.visits ? (t.views / t.visits).toFixed(1) : "–"}</span>
            <span className="hd-chip flat">{fmt(t.views)} page views</span>
          </div>
        </div>
      )}
      {readers.referrers && (
        <section className="hd-card">
          <h2>
            Where readers come from <small>visits</small>
          </h2>
          <Bars rows={referrers} thaana={false} />
        </section>
      )}
      {readers.countries && (
        <section className="hd-card">
          <h2>
            Countries <small>visits</small>
          </h2>
          <Bars rows={countries} thaana={false} />
        </section>
      )}
      {phonePct !== null && (
        <section className="hd-card">
          <h2>Phone or computer</h2>
          <div className="hd-big">
            {phonePct}% <small>on phones</small>
          </div>
          <div className="hd-split" role="img" aria-label={`${phonePct} percent on phones, ${100 - phonePct} percent on computers`}>
            <span className="hd-split-a" style={{ width: `${phonePct}%` }} />
            <span className="hd-split-b" style={{ width: `${100 - phonePct}%` }} />
          </div>
          <div className="hd-legend">
            <span>
              <i className="hd-split-a" />
              Phone {phonePct}%
            </span>
            <span>
              <i className="hd-split-b" />
              Computer {100 - phonePct}%
            </span>
          </div>
        </section>
      )}
      {goodPct !== null && (
        <section className="hd-card">
          <h2>Page speed for readers</h2>
          <div className="hd-speed">
            <span className={`hd-chip ${goodPct >= 75 ? "up" : "attn"}`}>{goodPct >= 75 ? "✓ Good" : "Needs work"}</span>
            <span className="hd-small">Main picture or headline showed quickly for {goodPct}% of visits</span>
          </div>
        </section>
      )}
      {errors.length > 0 && (
        <section className="hd-card">
          <h2>Some reader numbers didn&apos;t load</h2>
          {errors.map(([k, msg]) => (
            <p className="hd-small" key={k}>
              <b>{k}</b>: {msg}
            </p>
          ))}
        </section>
      )}
    </>
  );
}
