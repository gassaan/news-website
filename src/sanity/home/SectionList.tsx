import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useClient } from "sanity";
import { IntentLink } from "sanity/router";
import { usePaneRouter } from "sanity/structure";
import { API_URL } from "../../lib/api";
import "./home.css";

// A section's list (articles, stories, polls, …), opened from a tile on the start
// screen: search, filter buttons for each status, items grouped by month, and for
// articles the number of reads. Tapping an item opens it next to (or, on a phone,
// instead of) the list. Swiping an item to the right shows a Delete button, which
// asks before anything is deleted.

type Kind = "draft" | "changes" | "scheduled" | "published";
type Raw = { _id: string; title?: string; sub?: string; img?: string; date?: string; slug?: string };
type Item = { id: string; title: string; sub: string; img?: string; date?: string; slug?: string; kind: Kind };

type Config = {
  title: string;
  unit: [string, string];
  date?: string; // the field the list is sorted and grouped by (newest first); none: A to Z
  fields: string; // GROQ for title, sub (second line) and img (picture)
  icon: string; // used when an item has no picture
  views?: boolean;
  labels?: Partial<Record<Kind, string>>;
};

const IMG = (field: string) => `"img": ${field}.asset->url`;
const CONFIG: Record<string, Config> = {
  article: { title: "ޚަބަރު / ރިޕޯޓު", unit: ["article", "articles"], date: "publishedAt", fields: `title, ${IMG("image")}`, icon: "news", views: true },
  story: { title: "ވާހަކަ", unit: ["story", "stories"], date: "publishedAt", fields: `title, ${IMG("poster")}`, icon: "book" },
  author: { title: "ލިޔުންތެރިން", unit: ["writer", "writers"], fields: `title, "sub": role, ${IMG("photo")}`, icon: "user" },
  photoAlbum: { title: "ފޮޓޯ ގެލެރީ", unit: ["album", "albums"], date: "date", fields: `title, ${IMG("photos[0]")}`, icon: "image" },
  graphic: { title: "ގުރެފިކްސް", unit: ["graphic", "graphics"], date: "date", fields: `title, ${IMG("image")}`, icon: "pie" },
  poll: { title: "ޕޯލްސް", unit: ["poll", "polls"], date: "publishedAt", fields: `title, ${IMG("image")}`, icon: "bars" },
  comment: {
    title: "ކޮމެންޓްތައް",
    unit: ["comment", "comments"],
    date: "submittedAt",
    fields: `"title": name, "sub": text`,
    icon: "chat",
    labels: { draft: "Waiting", published: "Approved", changes: "Edited, not published" },
  },
};

const ICONS: Record<string, string> = {
  news: "M4 5h12v14H6a2 2 0 0 1-2-2zM16 9h4v8a2 2 0 0 1-2 2M8 9h4M8 13h4M8 16h2",
  book: "M5 5a2 2 0 0 1 2-2h12v15H7a2 2 0 0 0-2 2zM5 20a2 2 0 0 0 2 1h12v-3M9 7h6",
  user: "M8 8a4 4 0 1 0 8 0a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0",
  image: "M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM7 10a2 2 0 1 0 4 0a2 2 0 1 0-4 0M21 15l-5-5-10 10",
  pie: "M12 3v9h9M21 12a9 9 0 1 1-9-9",
  bars: "M6 20v-6M12 20V5M18 20v-10",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z",
};

const LABELS: Record<Kind, string> = { draft: "Draft", changes: "Changes not published", scheduled: "Scheduled", published: "Published" };
const CHIPS: { kind: Kind | "all"; name: string }[] = [
  { kind: "all", name: "All" },
  { kind: "published", name: "Published" },
  { kind: "changes", name: "Changes" },
  { kind: "draft", name: "Drafts" },
  { kind: "scheduled", name: "Scheduled" },
];

const MONTHS_DV = ["ޖެނުއަރީ", "ފެބްރުއަރީ", "މާރިޗު", "އޭޕްރީލް", "މޭ", "ޖޫން", "ޖުލައި", "އޯގަސްޓް", "ސެޕްޓެމްބަރު", "އޮކްޓޯބަރު", "ނޮވެމްބަރު", "ޑިސެމްބަރު"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Dates in Maldives time (UTC+5); date-only values ("2026-09-25") are taken as they are.
function mv(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return { y: +value.slice(0, 4), m: +value.slice(5, 7), d: +value.slice(8, 10), time: "" };
  const s = new Date(Date.parse(value) + 5 * 3600000).toISOString();
  return { y: +s.slice(0, 4), m: +s.slice(5, 7), d: +s.slice(8, 10), time: s.slice(11, 16) };
}
const when = (value?: string) => {
  if (!value) return "";
  const t = mv(value);
  return `${t.d} ${MONTHS_DV[t.m - 1]}${t.time ? ` · ${t.time}` : ""}`;
};

const cleanSlug = (slug?: string) => String(slug ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const short = (n: number) => (n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n));

const OPEN = 96; // how far a swiped row stays open, the width of its Delete button

// What the delete question says, by item and status.
function deleteText(type: string, kind: Kind) {
  if (type === "comment") {
    return kind === "draft"
      ? "It hasn't been approved, so it isn't on the website."
      : "It is on the website now. Deleting removes it at the next update (about 10 minutes).";
  }
  if (kind === "draft") return "This draft isn't on the website.";
  if (kind === "scheduled") return "It is scheduled to go live. Deleting cancels that.";
  return "It is on the website now. Deleting removes it from the site at the next update (about 10 minutes).";
}

export default function SectionList(props: { options?: { type?: string } }) {
  const type = props.options?.type ?? "article";
  const cfg = CONFIG[type] ?? CONFIG.article;
  const client = useClient({ apiVersion: "2025-02-19" });
  const { ChildLink, BackLink, routerPanesState, groupIndex } = usePaneRouter();
  const [raw, setRaw] = useState<Raw[] | null>(null);
  const [views, setViews] = useState<Record<string, number>>({});
  const [show, setShow] = useState<Kind | "all">("all");
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(0);
  // Swipe to delete: the row left open, the row being dragged, and the item being asked about.
  const [swiped, setSwiped] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; dx: number } | null>(null);
  const [confirm, setConfirm] = useState<Item | null>(null);
  const [scheme, setScheme] = useState("dark"); // the sheet sits outside the dashboard, so it carries light/dark itself
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const start = useRef<{ id: string; x: number; y: number; base: number; moved: boolean } | null>(null);
  const justDragged = useRef(false);

  const query = `*[_type == $type]{ _id, ${cfg.fields}${cfg.date ? `, "date": ${cfg.date}` : ""}${cfg.views ? `, "slug": slug.current` : ""} }`;
  const refresh = useCallback(() => {
    client.fetch<Raw[]>(query, { type }, { perspective: "raw" }).then((r) => {
      setRaw(r);
      setNow(Date.now());
    }, () => {});
  }, [client, query, type]);

  // Load now, then again whenever something of this kind changes (published, edited, deleted).
  useEffect(() => {
    const first = setTimeout(refresh, 0);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sub = client.listen(`*[_type == $type]`, { type }, { includeResult: false, visibility: "query" }).subscribe({
      next: () => {
        clearTimeout(timer);
        timer = setTimeout(refresh, 600);
      },
      error: () => {},
    });
    return () => {
      clearTimeout(first);
      clearTimeout(timer);
      sub.unsubscribe();
    };
  }, [client, refresh, type]);

  // One entry per item: the draft's text when someone is editing it, and its status.
  const items = useMemo<Item[]>(() => {
    if (!raw) return [];
    const byId = new Map<string, { pub?: Raw; draft?: Raw }>();
    for (const r of raw) {
      if (r._id.startsWith("versions.")) continue;
      const draft = r._id.startsWith("drafts.");
      const id = draft ? r._id.slice(7) : r._id;
      const e = byId.get(id) ?? {};
      e[draft ? "draft" : "pub"] = r;
      byId.set(id, e);
    }
    const list: Item[] = [];
    for (const [id, { pub, draft }] of byId) {
      const r = (draft ?? pub)!;
      const date = r.date;
      const kind: Kind = !pub ? "draft" : draft ? "changes" : date && cfg.date === "publishedAt" && Date.parse(date) > now ? "scheduled" : "published";
      list.push({ id, title: r.title?.trim() || "—", sub: r.sub ?? "", img: r.img, date, slug: pub?.slug, kind });
    }
    return list.sort((a, b) =>
      cfg.date ? (b.date ?? "9999").localeCompare(a.date ?? "9999") : a.title.localeCompare(b.title),
    );
  }, [raw, cfg.date, now]);

  // Reads for published articles, from the site's online service.
  const slugs = useMemo(() => (cfg.views ? items.filter((i) => i.slug).map((i) => cleanSlug(i.slug)) : []), [items, cfg.views]);
  useEffect(() => {
    if (!API_URL || slugs.length === 0) return;
    const chunks: string[][] = [];
    for (let i = 0; i < slugs.length; i += 60) chunks.push(slugs.slice(i, i + 60));
    Promise.all(
      chunks.map((c) => fetch(`${API_URL}/views?slugs=${c.join(",")}`).then((r) => (r.ok ? r.json() : {}), () => ({}))),
    ).then((all) => setViews(Object.assign({}, ...all)));
  }, [slugs]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const i of items) c[i.kind] = (c[i.kind] ?? 0) + 1;
    return c;
  }, [items]);

  const q = search.trim().toLowerCase();
  const visible = items.filter(
    (i) => (show === "all" || i.kind === show) && (!q || i.title.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q)),
  );

  // Month groups for dated lists; one group for writers.
  const thisYear = new Date(now || 0).getUTCFullYear();
  const groups: { name: string; items: Item[] }[] = [];
  for (const i of visible) {
    let name = "";
    if (cfg.date) {
      if (!i.date) name = "No date";
      else {
        const t = mv(i.date);
        name = t.y === thisYear ? MONTHS_EN[t.m - 1] : `${MONTHS_EN[t.m - 1]} ${t.y}`;
      }
      if (i.kind === "scheduled") name = "Coming up";
    }
    const last = groups[groups.length - 1];
    if (last && last.name === name) last.items.push(i);
    else groups.push({ name, items: [i] });
  }

  const openId = routerPanesState[groupIndex + 1]?.[0]?.id;
  const Link = ChildLink as unknown as (p: {
    childId: string;
    className: string;
    style?: CSSProperties;
    draggable?: boolean;
    onPointerDown?: (e: PointerEvent<HTMLElement>) => void;
    onPointerMove?: (e: PointerEvent<HTMLElement>) => void;
    onPointerUp?: (e: PointerEvent<HTMLElement>) => void;
    onPointerCancel?: (e: PointerEvent<HTMLElement>) => void;
    children: ReactNode;
  }) => ReactNode;
  const Back = BackLink as unknown as (p: { className: string; "aria-label": string; children: ReactNode }) => ReactNode;
  const label = (k: Kind) => cfg.labels?.[k] ?? LABELS[k];
  const chips = CHIPS.filter((c) => c.kind === "all" || c.kind === "published" || counts[c.kind]);

  // A sideways drag moves the row; an up-and-down one is left to scrolling.
  const down = (e: PointerEvent<HTMLElement>, id: string) => {
    justDragged.current = false; // phones send no tap after a swipe, so clear it here
    start.current = { id, x: e.clientX, y: e.clientY, base: swiped === id ? OPEN : 0, moved: false };
  };
  const move = (e: PointerEvent<HTMLElement>, id: string) => {
    const s = start.current;
    if (!s || s.id !== id) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.moved) {
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
        start.current = null;
        return;
      }
      if (Math.abs(dx) < 8) return;
      s.moved = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    setDrag({ id, dx: Math.max(0, Math.min(OPEN + 54, s.base + dx)) });
  };
  const up = (id: string) => {
    const s = start.current;
    start.current = null;
    if (!s || s.id !== id || !s.moved) return;
    justDragged.current = true;
    const dx = drag?.id === id ? drag.dx : s.base;
    setDrag(null);
    setSwiped(dx > OPEN / 2 ? id : null);
  };
  // After a drag, or while a row is open, a tap closes it instead of opening the item.
  const clickCapture = (e: MouseEvent, id: string) => {
    const onDelete = (e.target as HTMLElement).closest(".sl-del");
    if (onDelete) return;
    if (justDragged.current) {
      // the tap that ends a swipe
      e.preventDefault();
      e.stopPropagation();
      justDragged.current = false;
    } else if (swiped === id) {
      e.preventDefault();
      e.stopPropagation();
      setSwiped(null);
    }
  };

  const remove = async () => {
    if (!confirm) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await client.transaction().delete(confirm.id).delete(`drafts.${confirm.id}`).commit();
      setConfirm(null);
      setSwiped(null);
      refresh();
    } catch (err) {
      const message = String((err as Error)?.message ?? err);
      setDeleteError(
        /reference/i.test(message)
          ? "It is still used somewhere else (for example the home page's main card or breaking news). Remove it there first."
          : "It couldn't be deleted. Check the connection and try again.",
      );
    } finally {
      setDeleting(false);
    }
  };
  const close = () => {
    if (deleting) return;
    setConfirm(null);
    setDeleteError("");
  };

  return (
    <div className="sl">
      <div className="sl-head">
        <Back className="sl-back" aria-label="Back">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
        </Back>
        {type !== "comment" && (
          <IntentLink intent="create" params={{ type }} className="sl-new">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New
          </IntentLink>
        )}
        <div className="sl-title">
          <span className={`sl-ic ${type}`}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={ICONS[cfg.icon]} />
            </svg>
          </span>
          <span>
            <h1>{cfg.title}</h1>
            <span className="sl-count">{raw ? `${items.length} ${items.length === 1 ? cfg.unit[0] : cfg.unit[1]}` : " "}</span>
          </span>
        </div>
      </div>

      <label className="sl-search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 11a7 7 0 1 0 14 0a7 7 0 1 0-14 0M16 16l4 4" />
        </svg>
        <input type="search" placeholder={`Search ${cfg.unit[1]}`} value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>

      {items.length > 0 && (
        <div className="sl-chips" role="group" aria-label="Show">
          {chips.map((c) => (
            <button key={c.kind} type="button" aria-pressed={show === c.kind} onClick={() => setShow(c.kind)}>
              {c.kind === "published" ? label("published") : c.kind === "draft" && type === "comment" ? label("draft") : c.name}
              <span>{counts[c.kind] ?? 0}</span>
            </button>
          ))}
        </div>
      )}

      {!raw && <p className="sl-empty">Loading…</p>}
      {raw && visible.length === 0 && <p className="sl-empty">{q ? "Nothing matches your search." : "Nothing here yet."}</p>}

      {groups.map((g, gi) => (
        <section key={`${g.name}-${gi}`} className="sl-group">
          {g.name && <h2>{g.name}</h2>}
          <div className="sl-box">
            {g.items.map((i) => {
              const dx = drag?.id === i.id ? drag.dx : swiped === i.id ? OPEN : 0;
              return (
                <div key={i.id} className="sl-swipe" onClickCapture={(e) => clickCapture(e, i.id)}>
                  <button
                    type="button"
                    className="sl-del"
                    tabIndex={swiped === i.id ? 0 : -1}
                    aria-hidden={swiped !== i.id}
                    onClick={(e) => {
                      setScheme(e.currentTarget.closest("[data-scheme]")?.getAttribute("data-scheme") ?? "dark");
                      setConfirm(i);
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                    </svg>
                    Delete
                  </button>
                  <Link
                    childId={i.id}
                    className={`sl-row${openId === i.id ? " open" : ""}${drag?.id === i.id ? " dragging" : ""}`}
                    style={{ transform: dx ? `translateX(${dx}px)` : undefined }}
                    draggable={false}
                    onPointerDown={(e) => down(e, i.id)}
                    onPointerMove={(e) => move(e, i.id)}
                    onPointerUp={() => up(i.id)}
                    onPointerCancel={() => up(i.id)}
                  >
                  {i.img ? (
                    // eslint-disable-next-line @next/next/no-img-element -- the CMS loads Sanity's own resized pictures
                    <img src={`${i.img}?w=120&h=120&fit=crop&auto=format`} alt="" loading="lazy" />
                  ) : (
                    <span className={`sl-noimg ${type}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={ICONS[cfg.icon]} />
                      </svg>
                    </span>
                  )}
                  <span className="sl-text">
                    <span className="sl-t">{i.title}</span>
                    {i.sub && <span className="sl-sub">{i.sub}</span>}
                    {(i.date || i.kind !== "published") && (
                      <span className="sl-meta">
                        <span className={`sl-dot ${i.kind}`} />
                        {i.date && <span className="sl-date">{when(i.date)}</span>}
                        {i.kind !== "published" && <span className={`sl-kind ${i.kind}`}>{label(i.kind)}</span>}
                      </span>
                    )}
                  </span>
                  {cfg.views && i.slug && views[cleanSlug(i.slug)] !== undefined && (
                    <span className="sl-views" aria-label={`${views[cleanSlug(i.slug)]} reads`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 5C6.5 5 2.7 9.4 1.5 12c1.2 2.6 5 7 10.5 7s9.3-4.4 10.5-7C21.3 9.4 17.5 5 12 5zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
                      </svg>
                      {short(views[cleanSlug(i.slug)])}
                    </span>
                  )}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* The question goes on the page itself, above Sanity's own pop-ups. */}
      {confirm &&
        createPortal(
          <div data-scheme={scheme}>
            <div className="sl sl-layer">
              <div className="sl-sheet-back" onClick={close} onKeyDown={(e) => e.key === "Escape" && close()}>
                <section className="sl-sheet" role="dialog" aria-modal="true" aria-labelledby="sl-sheet-title" onClick={(e) => e.stopPropagation()}>
                  <span className="sl-sheet-ic" aria-hidden="true">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                    </svg>
                  </span>
                  <h2 id="sl-sheet-title">Delete this {confirm.kind === "draft" && type !== "comment" ? "draft" : cfg.unit[0]}?</h2>
                  <p>{deleteText(type, confirm.kind)} This can&apos;t be undone.</p>
                  <div className="sl-sheet-item">
                    {confirm.img ? (
                      // eslint-disable-next-line @next/next/no-img-element -- the CMS loads Sanity's own resized pictures
                      <img src={`${confirm.img}?w=96&h=96&fit=crop&auto=format`} alt="" />
                    ) : (
                      <span className={`sl-noimg ${type}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d={ICONS[cfg.icon]} />
                        </svg>
                      </span>
                    )}
                    <span>{confirm.title}</span>
                  </div>
                  {deleteError && <p className="sl-sheet-error">{deleteError}</p>}
                  <button type="button" className="sl-sheet-delete" disabled={deleting} onClick={remove}>
                    {deleting ? "Deleting…" : `Delete ${confirm.kind === "draft" && type !== "comment" ? "draft" : cfg.unit[0]}`}
                  </button>
                  <button type="button" className="sl-sheet-cancel" disabled={deleting} onClick={close} autoFocus>
                    Cancel
                  </button>
                </section>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
