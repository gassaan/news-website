import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@sanity/ui";
import { useClient, useColorSchemeSetValue, useColorSchemeValue, useCurrentUser, useWorkspace, type NavbarProps } from "sanity";
import { IntentLink, useRouter } from "sanity/router";
import StudioLogo from "../StudioLogo";
import NotificationBell from "./NotificationBell";
import "./navbar.css";

// The dashboard's top bar: the logo and name (back to the start screen), search,
// the notifications bell and the editor's own circle, which opens a menu with Home,
// Dashboard, dark mode, the website and signing out. It replaces Sanity's bar, whose
// drafts/releases switch and "who's online" button aren't needed here.

const SITE_HOME = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`;
const TYPES: Record<string, string> = {
  article: "Article",
  story: "Story",
  author: "Writer",
  photoAlbum: "Album",
  graphic: "Graphic",
  poll: "Poll",
};
type Hit = { _id: string; _type: string; title?: string; img?: string; _updatedAt: string };

function Icon({ d, size = 20 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
const SEARCH = "M4 11a7 7 0 1 0 14 0a7 7 0 1 0-14 0M16 16l4 4";

// Search: every article, story, writer, album, graphic and poll, filtered as you type.
function SearchSheet({ onClose }: { onClose: () => void }) {
  const client = useClient({ apiVersion: "2025-02-19" });
  const [all, setAll] = useState<Hit[] | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => {
    client
      .fetch<Hit[]>(
        `*[_type in $types]{ _id, _type, title, _updatedAt, "img": coalesce(image, poster, photo, photos[0]).asset->url }`,
        { types: Object.keys(TYPES) },
        { perspective: "raw" },
      )
      .then((rows) => {
        // One entry per item; a draft's title wins over the published one.
        const byId = new Map<string, Hit>();
        for (const r of rows) {
          if (r._id.startsWith("versions.")) continue;
          const id = r._id.replace(/^drafts\./, "");
          if (!byId.has(id) || r._id.startsWith("drafts.")) byId.set(id, { ...r, _id: id });
        }
        setAll([...byId.values()].sort((a, b) => b._updatedAt.localeCompare(a._updatedAt)));
      }, () => setAll([]));
  }, [client]);

  const term = q.trim().toLowerCase();
  const hits = useMemo(
    () => (all ?? []).filter((h) => !term || (h.title ?? "").toLowerCase().includes(term)).slice(0, term ? 40 : 8),
    [all, term],
  );

  return (
    <div className="hn-sheet-back" onClick={onClose} onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <section className="hn-search" role="dialog" aria-modal="true" aria-label="Search" onClick={(e) => e.stopPropagation()}>
        <div className="hn-search-row">
          <label className="hn-search-box">
            <Icon d={SEARCH} size={19} />
            <input
              type="search"
              placeholder="Search articles, stories, writers…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
          </label>
          <button type="button" className="hn-text-btn" onClick={onClose}>
            Close
          </button>
        </div>
        <span className="hn-search-label">{term ? `${hits.length} found` : "Recently changed"}</span>
        {!all && <p className="hn-search-note">Loading…</p>}
        {all && term && hits.length === 0 && <p className="hn-search-note">Nothing matches “{q.trim()}”.</p>}
        <div className="hn-search-list">
          {hits.map((h) => (
            <IntentLink key={h._id} intent="edit" params={{ id: h._id, type: h._type }} className="hn-hit" onClick={onClose}>
              {h.img ? (
                // eslint-disable-next-line @next/next/no-img-element -- Sanity's own resized picture
                <img src={`${h.img}?w=96&h=96&fit=crop&auto=format`} alt="" />
              ) : (
                <span className="hn-hit-noimg" aria-hidden="true" />
              )}
              <span className="hn-hit-text">
                <span className="hn-hit-title">{h.title?.trim() || "—"}</span>
                <span className="hn-hit-type">{TYPES[h._type] ?? h._type}</span>
              </span>
            </IntentLink>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function StudioNavbar(props: NavbarProps) {
  void props; // Sanity's own bar isn't drawn; this one takes its place.
  const user = useCurrentUser();
  const workspace = useWorkspace();
  const router = useRouter();
  const scheme = useColorSchemeValue();
  const setScheme = useColorSchemeSetValue();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const menuWrap = useRef<HTMLDivElement>(null);

  // The menu closes when tapping anywhere else, or with Escape.
  useEffect(() => {
    if (!menu) return;
    const away = (e: PointerEvent) => {
      if (menuWrap.current && !menuWrap.current.contains(e.target as Node)) setMenu(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);

  const tool = (router.state as { tool?: string }).tool;
  const go = (name: string) => {
    setMenu(false);
    router.navigate({ tool: name });
  };
  const initial = (user?.name ?? "?").trim().slice(0, 1).toUpperCase();
  const avatar = (size: number) =>
    user?.profileImage ? (
      // eslint-disable-next-line @next/next/no-img-element -- the account's own picture
      <img src={user.profileImage} alt="" width={size} height={size} className="hn-avatar-img" />
    ) : (
      <span className="hn-avatar-letter">{initial}</span>
    );

  return (
    // A Card, so the bar and its menus get the dashboard's colours (light or dark).
    <Card className="hn-bar" as="header">
      <button type="button" className="hn-brand" onClick={() => go("structure")} aria-label="Hulhangu, home">
        <span className="hn-logo">
          <StudioLogo />
        </span>
        <span className="hn-name">
          <b>Hulhangu</b>
          <small>{tool === "dashboard" ? "Dashboard" : "Newsroom"}</small>
        </span>
      </button>

      <button type="button" className="hn-round" aria-label="Search" onClick={() => setSearch(true)}>
        <Icon d={SEARCH} />
      </button>
      <NotificationBell />

      <div className="hn-me" ref={menuWrap}>
        <button type="button" className="hn-avatar" aria-label="Your menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
          {avatar(40)}
        </button>
        {menu && (
          <div className="hn-menu" role="menu">
            <div className="hn-menu-me">
              <span className="hn-avatar small">{avatar(36)}</span>
              <span>
                <b>{user?.name ?? "Your account"}</b>
                <small>{user?.email ?? ""}</small>
              </span>
            </div>
            <button type="button" role="menuitem" className={tool !== "dashboard" ? "on" : ""} onClick={() => go("structure")}>
              <Icon d="M3 11l9-7 9 7v9H3zM9 20v-6h6v6" size={19} />
              Home
            </button>
            <button type="button" role="menuitem" className={tool === "dashboard" ? "on" : ""} onClick={() => go("dashboard")}>
              <Icon d="M6 20v-6M12 20V5M18 20v-10" size={19} />
              Dashboard
            </button>
            {setScheme && (
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={scheme === "dark"}
                onClick={() => setScheme(scheme === "dark" ? "light" : "dark")}
              >
                <Icon d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" size={19} />
                <span className="hn-grow">Dark mode</span>
                <span className="hn-switch" aria-hidden="true">
                  <span />
                </span>
              </button>
            )}
            <a role="menuitem" href={SITE_HOME} target="_blank" rel="noopener noreferrer" onClick={() => setMenu(false)}>
              <Icon d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" size={19} />
              Open the website
            </a>
            {workspace.auth.logout && (
              <button type="button" role="menuitem" className="hn-out" onClick={() => workspace.auth.logout?.()}>
                <Icon d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" size={19} />
                Sign out
              </button>
            )}
          </div>
        )}
      </div>

      {search && <SearchSheet onClose={() => setSearch(false)} />}
    </Card>
  );
}
