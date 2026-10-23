import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useClient } from "sanity";
import { IntentLink } from "sanity/router";
import { usePaneRouter } from "sanity/structure";
import { useNotifications } from "../notifications/useNotifications";
import "./home.css";

// The CMS start screen: a purple welcome card with one-tap "new …" buttons, the
// breaking news strip with an on/off switch, a coloured tile for every section and
// the three site pages. Each tile opens its list next to (or, on a phone, instead of)
// this screen, exactly like the old menu did.

const HOUR = 3600000;

const ICONS = {
  bolt: "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
  star: "M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3l-5.5 2.9 1-6.2L3 9.6l6.2-.9z",
  news: "M4 5h12v14H6a2 2 0 0 1-2-2zM16 9h4v8a2 2 0 0 1-2 2M8 9h4M8 13h4M8 16h2",
  book: "M5 5a2 2 0 0 1 2-2h12v15H7a2 2 0 0 0-2 2zM5 20a2 2 0 0 0 2 1h12v-3M9 7h6",
  user: "M8 8a4 4 0 1 0 8 0a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0",
  image:
    "M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM7 10a2 2 0 1 0 4 0a2 2 0 1 0-4 0M21 15l-5-5-10 10",
  pie: "M12 3v9h9M21 12a9 9 0 1 1-9-9",
  bars: "M6 20v-6M12 20V5M18 20v-10",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  doc: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h4",
  plus: "M12 5v14M5 12h14",
  mic: "M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0zM5 11a7 7 0 0 0 14 0M12 18v3",
};
type IconName = keyof typeof ICONS;

function Icon({ name, size = 18, width = 2 }: { name: IconName; size?: number; width?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

// The "new …" buttons in the welcome card.
const QUICK: { type: string; title: string; icon: IconName }[] = [
  { type: "article", title: "ޚަބަރު", icon: "news" },
  { type: "story", title: "ވާހަކަ", icon: "book" },
  { type: "poll", title: "ޕޯލް", icon: "bars" },
  { type: "photoAlbum", title: "ފޮޓޯ", icon: "image" },
];

// The tiles; the id is the list each one opens (see sanity.config.ts).
const TILES: { id: string; title: string; icon: IconName; tone: string; unit: [string, string] }[] = [
  { id: "featuredArticles", title: "މައި ކާޑުގެ ލިޔުންތައް", icon: "star", tone: "amber", unit: ["on the home page", "on the home page"] },
  { id: "article", title: "ޚަބަރު / ރިޕޯޓު", icon: "news", tone: "lav", unit: ["article", "articles"] },
  { id: "story", title: "ވާހަކަ", icon: "book", tone: "pink", unit: ["story", "stories"] },
  { id: "author", title: "ލިޔުންތެރިން", icon: "user", tone: "teal", unit: ["writer", "writers"] },
  { id: "photoAlbum", title: "ފޮޓޯ ގެލެރީ", icon: "image", tone: "sky", unit: ["album", "albums"] },
  { id: "graphic", title: "ގުރެފިކްސް", icon: "pie", tone: "orange", unit: ["graphic", "graphics"] },
  { id: "poll", title: "ޕޯލްސް", icon: "bars", tone: "cyan", unit: ["poll", "polls"] },
  { id: "comment", title: "ކޮމެންޓްތައް", icon: "chat", tone: "blue", unit: ["comment", "comments"] },
];

const PAGES: { id: string; title: string; icon: IconName }[] = [
  { id: "contactInfo", title: "ގުޅުއްވުމަށް", icon: "mail" },
  { id: "privacyPolicy", title: "ޕްރައިވެސީ ޕޮލިސީ", icon: "shield" },
  { id: "termsOfUse", title: "ބޭނުންކުރުމުގެ ޝަރުތުތައް", icon: "doc" },
];

type Breaking = { _id: string; on?: boolean; headline?: string; hasArticle: boolean };
type Data = { featured: number; counts: Record<string, number>; breaking: Breaking[] };

const published = '!(_id in path("drafts.**"))';
const QUERY = `{
  "featured": count(*[_id == "featuredArticles"][0].articles),
  "counts": {
    ${TILES.filter((t) => t.id !== "featuredArticles")
      .map((t) => `"${t.id}": count(*[_type == "${t.id}" && ${published}])`)
      .join(",\n    ")}
  },
  "breaking": *[_id in ["breakingNews", "drafts.breakingNews"]]{ _id, on, headline, "hasArticle": defined(article) }
}`;

const countText = (id: string, [one, many]: [string, string], data: Data | null) => {
  if (!data) return "";
  const n = id === "featuredArticles" ? data.featured : (data.counts[id] ?? 0);
  return `${n} ${n === 1 ? one : many}`;
};

function greeting(d: Date) {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function StudioHome() {
  const client = useClient({ apiVersion: "2025-02-19" });
  const { ChildLink, routerPanesState, groupIndex } = usePaneRouter();
  const { counts, now } = useNotifications();
  const [data, setData] = useState<Data | null>(null);
  const [today] = useState(() => new Date());
  const [saving, setSaving] = useState(false);
  const [needsHeadline, setNeedsHeadline] = useState(false);

  const refresh = useCallback(() => {
    client.fetch<Data>(QUERY, {}, { perspective: "raw" }).then(setData, () => {});
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

  // The tile whose list is open next to this screen (on a computer) gets a ring.
  const openId = routerPanesState[groupIndex + 1]?.[0]?.id;
  const Link = ChildLink as unknown as (p: { childId: string; className: string; children: ReactNode }) => ReactNode;
  const cls = (base: string, id: string) => `${base}${openId === id ? " open" : ""}`;

  // Breaking news: the draft (if someone is editing it) is what will be published next.
  const pub = data?.breaking.find((b) => b._id === "breakingNews");
  const draft = data?.breaking.find((b) => b._id === "drafts.breakingNews");
  const current = draft ?? pub;
  const on = Boolean(pub?.on);

  const toggle = () => {
    if (saving) return;
    const next = !on;
    // The strip needs something to say, as the breaking news form itself checks.
    if (next && !(current?.headline?.trim() || current?.hasArticle)) {
      setNeedsHeadline(true);
      return;
    }
    setNeedsHeadline(false);
    setSaving(true);
    const tx = client.transaction();
    if (pub) tx.patch("breakingNews", (p) => p.set({ on: next }));
    else tx.createIfNotExists({ _id: "breakingNews", _type: "breakingNews" }).patch("breakingNews", (p) => p.set({ on: next }));
    if (draft) tx.patch("drafts.breakingNews", (p) => p.set({ on: next }));
    tx.commit()
      .then(refresh, () => {})
      .finally(() => setSaving(false));
  };

  const tag = (id: string): { text: string; tone: string } | null => {
    if (id === "comment" && counts.waiting) return { text: `${counts.waiting} new`, tone: "new" };
    if (id === "poll" && counts.pollEndsAt !== null) {
      const h = Math.max(0, counts.pollEndsAt - now) / HOUR;
      return { text: h < 1 ? "ends soon" : `ends in ${Math.round(h)}h`, tone: "soon" };
    }
    const n = counts.scheduled[id];
    return n ? { text: `${n} scheduled`, tone: "sched" } : null;
  };

  return (
    <div className="sh">
      <section className="sh-hero">
        <div className="sh-hero-top">
          <div>
            <span className="sh-hello">{greeting(today)}</span>
            <h1>Newsroom</h1>
          </div>
          <span className="sh-date">{today.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</span>
        </div>
        <div className="sh-quick">
          {QUICK.map((q) => (
            <IntentLink key={q.type} intent="create" params={{ type: q.type }} className="sh-q" aria-label={`New ${q.type}`}>
              <span className="sh-q-ic">
                <Icon name={q.icon} size={22} />
                <span className="sh-q-plus">
                  <Icon name="plus" size={12} width={3.2} />
                </span>
              </span>
              <span className="sh-q-t">{q.title}</span>
            </IntentLink>
          ))}
        </div>
      </section>

      <div className={`sh-breaking${on ? " on" : ""}${openId === "breakingNews" ? " open" : ""}`}>
        <span className="sh-b-ic">
          <Icon name="bolt" size={21} />
        </span>
        <Link childId="breakingNews" className="sh-b-text">
          <span className="sh-b-t">އަވަސް ޚަބަރު</span>
          <span className="sh-b-s">
            {needsHeadline ? "Write a headline or pick an article first (tap here)" : on ? "Red strip is showing on articles" : "Red strip is hidden"}
          </span>
        </Link>
        <button
          type="button"
          className="sh-switch"
          role="switch"
          aria-checked={on}
          aria-label="Show the breaking news strip"
          disabled={!data || saving}
          onClick={toggle}
        >
          <span />
        </button>
      </div>

      <div className="sh-tiles">
        {TILES.map((t) => {
          const label = tag(t.id);
          return (
            <Link key={t.id} childId={t.id} className={cls(`sh-tile ${t.tone}`, t.id)}>
              <span className="sh-tile-top">
                <span className="sh-tile-ic">
                  <Icon name={t.icon} />
                </span>
                {label && <span className={`sh-tag ${label.tone}`}>{label.text}</span>}
              </span>
              <span className="sh-tile-t">{t.title}</span>
              <span className="sh-tile-n">{countText(t.id, t.unit, data)}</span>
            </Link>
          );
        })}
      </div>

      <h2 className="sh-label">Site pages</h2>
      <div className="sh-pages">
        {PAGES.map((p) => (
          <Link key={p.id} childId={p.id} className={cls("sh-page", p.id)}>
            <Icon name={p.icon} size={16} />
            {p.title}
          </Link>
        ))}
      </div>

      <h2 className="sh-label">Tools</h2>
      <div className="sh-pages">
        <Link childId="voiceTraining" className={cls("sh-page", "voiceTraining")}>
          <Icon name="mic" size={16} />
          އަޑު ތަމްރީނު · Voice training
        </Link>
      </div>
    </div>
  );
}
