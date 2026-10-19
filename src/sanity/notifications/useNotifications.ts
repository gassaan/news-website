import { useCallback, useEffect, useState } from "react";
import { useClient } from "sanity";
import { API_URL } from "../../lib/api";

// What needs the editors' attention, for the bell and the menu labels: comments
// waiting for approval, polls ending soon or just ended, and scheduled articles or
// stories that have just gone live. Checked every minute and when the CMS is reopened.

export type Notice = {
  id: string; // stable, so "read" survives refreshes
  kind: "comment" | "poll-ending" | "poll-ended" | "live";
  title: string;
  detail: string; // Dhivehi text: the comment, poll question or headline
  context?: string; // Dhivehi: the article a comment is on
  at: number; // when it happened (or, for "ending", when it ends)
  link: { id: string; type: string };
};

export type Counts = { waiting: number; pollEndsAt: number | null; scheduled: Record<string, number> };

type Waiting = { _id: string; name?: string; text?: string; target?: string; parent?: string; _createdAt: string };
type Poll = { _id: string; title: string; options?: string[]; closesAt: string };
type Item = { _id: string; _type: string; title: string; publishedAt: string; _updatedAt: string };
type Data = {
  waiting: Waiting[];
  published: string[];
  titles: { slug: string; title: string }[];
  polls: Poll[];
  live: Item[];
  scheduled: { _type: string }[];
};

const HOUR = 3600000;
const QUERY = `{
  "waiting": *[_type == "comment" && _id in path("drafts.**")]{ _id, name, text, target, parent, _createdAt },
  "published": *[_type == "comment" && !(_id in path("drafts.**"))]._id,
  "titles": *[_type == "article" && defined(slug.current)]{ "slug": slug.current, title },
  "polls": *[_type == "poll" && defined(closesAt) && !(_id in path("drafts.**"))]{ _id, title, options, closesAt },
  "live": *[_type in ["article", "story"] && !(_id in path("drafts.**")) && publishedAt <= $now && publishedAt > $since && _updatedAt < publishedAt]{ _id, _type, title, publishedAt, _updatedAt },
  "scheduled": *[_type in ["article", "story"] && !(_id in path("drafts.**")) && publishedAt > $now]{ _type }
}`;

const SEEN_KEY = "hulhangu-cms-seen";
function readSeen(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function useNotifications() {
  const client = useClient({ apiVersion: "2025-02-19" });
  const [data, setData] = useState<Data | null>(null);
  const [votes, setVotes] = useState<Record<string, Record<string, number>>>({});
  const [now, setNow] = useState(0);
  const [seen, setSeen] = useState<string[]>([]);

  const refresh = useCallback(() => {
    const t = Date.now();
    client
      .fetch<Data>(QUERY, { now: new Date(t).toISOString(), since: new Date(t - 24 * HOUR).toISOString() }, { perspective: "raw" })
      .then((d) => {
        setData(d);
        setNow(t);
        setSeen(readSeen());
      }, () => {});
    if (API_URL) {
      fetch(`${API_URL}/stats`)
        .then((r) => (r.ok ? r.json() : null))
        .then((s) => s?.polls && setVotes(s.polls), () => {});
    }
  }, [client]);

  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const every = setInterval(refresh, 60000);
    const onFocus = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearTimeout(first);
      clearInterval(every);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh]);

  const notices: Notice[] = [];
  const counts: Counts = { waiting: 0, pollEndsAt: null, scheduled: {} };
  if (data) {
    const titleOf = new Map(data.titles.map((a) => [a.slug, a.title]));
    const published = new Set(data.published);
    // A draft of an already-approved comment is an edit, not a new comment.
    const waiting = data.waiting.filter((c) => !published.has(c._id.replace(/^drafts\./, "")));
    counts.waiting = waiting.length;
    for (const c of waiting) {
      notices.push({
        id: `comment:${c._id}`,
        kind: "comment",
        title: c.parent ? "New reply waiting" : "New comment waiting",
        detail: `${c.name ?? ""}: ${c.text ?? ""}`,
        at: Date.parse(c._createdAt),
        link: { id: c._id.replace(/^drafts\./, ""), type: "comment" },
        context: (c.target && titleOf.get(c.target)) || undefined,
      });
    }
    for (const p of data.polls) {
      const end = Date.parse(p.closesAt);
      if (end > now && end - now <= 6 * HOUR) {
        notices.push({ id: `poll-ending:${p._id}:${p.closesAt}`, kind: "poll-ending", title: "Poll ends soon", detail: p.title, at: end, link: { id: p._id, type: "poll" } });
      }
      if (end > now && end - now <= 24 * HOUR) counts.pollEndsAt = Math.min(counts.pollEndsAt ?? end, end);
      if (end <= now && now - end <= 3 * 24 * HOUR) {
        const v = votes[p._id] ?? {};
        const total = Object.values(v).reduce((a, b) => a + b, 0);
        const best = Object.entries(v).sort((a, b) => b[1] - a[1])[0];
        const winner = best && total ? `${p.options?.[Number(best[0])] ?? ""} (${Math.round((best[1] / total) * 100)}%)` : "";
        notices.push({
          id: `poll-ended:${p._id}:${p.closesAt}`,
          kind: "poll-ended",
          title: total ? `Poll ended · ${total} votes` : "Poll ended",
          detail: winner ? `${p.title} — ${winner}` : p.title,
          at: end,
          link: { id: p._id, type: "poll" },
        });
      }
    }
    for (const it of data.live) {
      notices.push({
        id: `live:${it._id}:${it.publishedAt}`,
        kind: "live",
        title: it._type === "story" ? "Scheduled story is now live" : "Scheduled article is now live",
        detail: it.title,
        at: Date.parse(it.publishedAt),
        link: { id: it._id, type: it._type },
      });
    }
    for (const s of data.scheduled) counts.scheduled[s._type] = (counts.scheduled[s._type] ?? 0) + 1;
  }
  notices.sort((a, b) => b.at - a.at);
  const seenSet = new Set(seen);
  const unread = notices.filter((n) => !seenSet.has(n.id)).length;

  const markAllRead = () => {
    // Keep only ids that still exist, so the list on this device never grows forever.
    const ids = notices.map((n) => n.id);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
    } catch {
      // private browsing: read state lasts until the page is closed
    }
    setSeen(ids);
  };

  return { notices, counts, unread, seen: seenSet, markAllRead, now, ready: data !== null };
}
