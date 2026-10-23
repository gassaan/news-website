import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import {
  set,
  unset,
  useClient,
  useFormValue,
  type ArrayOfObjectsInputProps,
  type BooleanInputProps,
  type FieldProps,
  type ObjectInputProps,
  type ReferenceInputProps,
  type SlugInputProps,
  type StringInputProps,
  type TextInputProps,
} from "sanity";
import { toSlug } from "../slug";
import { formatWhen } from "../dates";
import "./editor.css";

// Tap-friendly inputs for the editing form: round buttons instead of lists and
// pickers, plus small helpers (counters, "Now", "From title").

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

// Every top-level field sits in its own rounded card. Facebook's fields share
// one card (their group is styled in editor.css), and nested fields stay plain.
export function CardField(props: FieldProps) {
  if (props.path.length !== 1 || props.name.startsWith("facebook")) return props.renderDefault(props);
  return <div className={`ef-card ef-${props.name}`}>{props.renderDefault(props)}</div>;
}

// Category: one round button per choice. Long choices (like the Facebook picture)
// get a full-width button each.
export function ChoiceInput(props: StringInputProps) {
  const { value, onChange, readOnly, schemaType } = props;
  const list = (schemaType.options?.list ?? []) as { title?: string; value?: string }[];
  const wide = list.some((o) => (o.title ?? "").length > 14);
  return (
    <div className={`ef-chips ${wide ? "ef-choices-wide" : "ef-choices"}`} role="radiogroup">
      {list.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            className="ef-chip"
            disabled={readOnly}
            onClick={() => !on && onChange(set(o.value!))}
          >
            {on && <Check />}
            {o.title ?? o.value}
          </button>
        );
      })}
    </div>
  );
}

// Writer: a photo button for each writer.
type Writer = { _id: string; title?: string; photo?: string };
export function WriterInput(props: ReferenceInputProps) {
  const { value, onChange, readOnly } = props;
  const client = useClient({ apiVersion: "2025-02-19" });
  const [writers, setWriters] = useState<Writer[] | null>(null);
  useEffect(() => {
    client
      .fetch<Writer[]>(`*[_type == "author" && !(_id in path("drafts.**"))] | order(title asc){ _id, title, "photo": photo.asset->url }`)
      .then(setWriters, () => setWriters([]));
  }, [client]);
  if (!writers) return <p className="ef-note">Loading writers…</p>;
  return (
    <div className="ef-chips ef-people" role="radiogroup">
      {writers.map((w) => {
        const on = value?._ref === w._id;
        return (
          <button
            key={w._id}
            type="button"
            role="radio"
            aria-checked={on}
            className="ef-chip ef-person"
            disabled={readOnly}
            onClick={() => !on && onChange(set({ _type: "reference", _ref: w._id }))}
          >
            {w.photo ? (
              // eslint-disable-next-line @next/next/no-img-element -- Sanity's own resized picture
              <img src={`${w.photo}?w=72&h=72&fit=crop&auto=format`} alt="" />
            ) : (
              <span className="ef-avatar" aria-hidden="true" />
            )}
            <span className="ef-name">{w.title ?? "—"}</span>
          </button>
        );
      })}
    </div>
  );
}

// Date and time: two round buttons that open the phone's own pickers, plus "Now".
const pad = (n: number) => String(n).padStart(2, "0");
export function DateTimeInput(props: StringInputProps) {
  const { value, onChange, readOnly } = props;
  const d = value ? new Date(value) : null;
  const date = d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : "";
  const time = d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : "";
  const [openedAt] = useState(() => Date.now());
  const save = (nd: string, nt: string) => {
    if (!nd) return onChange(unset());
    onChange(set(new Date(`${nd}T${nt || "00:00"}`).toISOString()));
  };
  // Sanity draws a date field's name inside its own picker, so this input shows it.
  const { title, description } = props.schemaType;
  const open = (e: MouseEvent<HTMLInputElement>) => {
    try {
      e.currentTarget.showPicker?.();
    } catch {
      // older browsers: the field still takes typing
    }
  };
  return (
    <div className="ef-when">
      {title && <span className="ef-label">{title}</span>}
      {typeof description === "string" && <span className="ef-desc">{description}</span>}
      <div className="ef-when-row">
        <label className="ef-pill">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16v14H4zM4 10h16M9 3v4M15 3v4" />
          </svg>
          <span className="ef-sr">Date</span>
          <input type="date" value={date} disabled={readOnly} onClick={open} onChange={(e) => save(e.target.value, time)} />
        </label>
        <label className="ef-pill">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 7v5l3 2" />
          </svg>
          <span className="ef-sr">Time</span>
          <input type="time" value={time} disabled={readOnly || !date} onClick={open} onChange={(e) => save(date, e.target.value)} />
        </label>
      </div>
      <div className="ef-when-row">
        <button type="button" className="ef-soft" disabled={readOnly} onClick={() => onChange(set(new Date().toISOString()))}>
          Now
        </button>
        {/* A new item starts at "now", a moment after the form opens: only later times count. */}
        {d && d.getTime() > openedAt + 60000 && <span className="ef-tag">Scheduled</span>}
      </div>
    </div>
  );
}

// Web address: the end of the page's link, filled from the headline with one tap.
const PREFIX: Record<string, string> = { article: "article", story: "story", author: "author", photoAlbum: "gallery" };
const SLUG_OK = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export function SlugInput(props: SlugInputProps) {
  const { value, onChange, readOnly, elementProps } = props;
  const title = useFormValue(["title"]) as string | undefined;
  const type = useFormValue(["_type"]) as string | undefined;
  const current = value?.current ?? "";
  const update = (next: string) => onChange(next ? set({ _type: "slug", current: next }) : unset());
  return (
    <div className="ef-slug">
      <div className="ef-slug-row">
        <label className="ef-slug-box">
          <span className="ef-slug-pre">…/{PREFIX[type ?? ""] ?? type}/</span>
          <input
            {...elementProps}
            value={current}
            placeholder="majlis-vote-2026"
            readOnly={readOnly}
            spellCheck={false}
            autoCapitalize="none"
            onChange={(e) => update(e.target.value)}
          />
        </label>
        <button type="button" className="ef-soft" disabled={readOnly || !title?.trim()} onClick={() => update(toSlug(title ?? ""))}>
          From title
        </button>
      </div>
      {SLUG_OK.test(current) && (
        <span className="ef-ok">
          <Check /> Looks good
        </span>
      )}
    </div>
  );
}

// Short summary: the normal box with a "44 / 250" counter and a bar that turns amber past the limit.
export function SummaryInput(props: TextInputProps) {
  const n = (props.value ?? "").length;
  const max = 250;
  return (
    <div className="ef-stack">
      {props.renderDefault(props)}
      <div className="ef-count">
        <span className="ef-bar" aria-hidden="true">
          <span style={{ width: `${Math.min(100, (n / max) * 100)}%` }} className={n > max ? "over" : ""} />
        </span>
        <span>
          {n} / {max}
        </span>
      </div>
    </div>
  );
}

// Facebook sharing: one card with the Facebook mark, a line saying what will
// happen and a big on/off switch, like the breaking news card on the start screen.
export function FacebookSwitch(props: BooleanInputProps) {
  const { value, onChange, readOnly, schemaType } = props;
  const on = Boolean(value);
  const status = readOnly && on ? "Already posted on Facebook" : on ? "Posts when the website updates" : "Not shared on Facebook";
  return (
    <div className={`ef-fb${on ? " on" : ""}`}>
      <span className="ef-fb-ic" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 8h3V4h-3c-2.8 0-4 1.8-4 4.3V10H7v4h3v8h4v-8h3l1-4h-4V8.6c0-.4.2-.6.6-.6z" />
        </svg>
      </span>
      <span className="ef-fb-text">
        <span className="ef-fb-t">{schemaType.title}</span>
        <span className="ef-fb-s">{status}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={schemaType.title ?? "Share on Facebook"}
        className="ef-switch"
        disabled={readOnly}
        onClick={() => onChange(set(!on))}
      >
        <span />
      </button>
    </div>
  );
}

// Photos: two big buttons (from the phone, or from photos already uploaded); once
// there is a photo, Change, Focus point and Remove underneath. The focus point is
// the part the website keeps in view when it crops the photo for small cards.
type Photo = { asset?: { _ref?: string }; hotspot?: { x: number; y: number; width?: number; height?: number } };
type Asset = { _id: string; url: string };

export function photoUrl(ref: string, projectId: string, dataset: string, width: number) {
  const [, id, size, ext] = ref.split("-");
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${size}.${ext}?w=${width}&auto=format`;
}

export function PhotoInput(props: ObjectInputProps) {
  const { onChange, readOnly } = props;
  const value = props.value as Photo | undefined;
  const client = useClient({ apiVersion: "2025-02-19" });
  const { projectId = "", dataset = "" } = client.config();
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [choosing, setChoosing] = useState(false); // "Change": the two buttons again
  const [focusing, setFocusing] = useState(false);
  const [library, setLibrary] = useState<Asset[] | null>(null);
  const [scheme, setScheme] = useState("dark");
  const ref = value?.asset?._ref;

  // Sanity refuses changes while the page is still connecting; say so instead of doing nothing.
  const save = (patch: Parameters<typeof onChange>[0]) => {
    try {
      onChange(patch);
      setError("");
      return true;
    } catch (err) {
      console.warn("Photo change was not saved", err);
      setError("The page is still connecting. Wait a moment and try again.");
      return false;
    }
  };
  const choose = (assetId: string) => {
    setChoosing(false);
    setLibrary(null);
    save(set({ _type: "image", asset: { _type: "reference", _ref: assetId } }));
  };
  const upload = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setError("");
    try {
      const asset = await client.assets.upload("image", f, { filename: f.name });
      choose(asset._id);
    } catch {
      setError("The photo couldn't be uploaded. Check the connection and try again.");
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  };
  const openLibrary = (e: MouseEvent<HTMLElement>) => {
    setScheme(e.currentTarget.closest("[data-scheme]")?.getAttribute("data-scheme") ?? "dark");
    setLibrary([]);
    client
      .fetch<Asset[]>(`*[_type == "sanity.imageAsset"] | order(_createdAt desc)[0...60]{ _id, url }`)
      .then(setLibrary, () => setError("The photo library couldn't be loaded."));
  };
  const setFocus = (e: MouseEvent<HTMLElement>) => {
    // measured on the picture itself, which is shown whole (not cropped)
    const box = (e.currentTarget.querySelector("img") ?? e.currentTarget).getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    const y = Math.min(1, Math.max(0, (e.clientY - box.top) / box.height));
    const h = value?.hotspot;
    setFocusing(false);
    save(set({ _type: "sanity.imageHotspot", x, y, width: h?.width ?? 0.3, height: h?.height ?? 0.3 }, ["hotspot"]));
  };

  const buttons = (
    <div className="ef-photo-pick">
      <button type="button" className="ef-photo-phone" disabled={readOnly || busy} onClick={() => file.current?.click()}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4" />
        </svg>
        <b>{busy ? "Uploading…" : "From phone"}</b>
        <small>Photos or camera</small>
      </button>
      <button type="button" className="ef-photo-lib" disabled={readOnly || busy} onClick={openLibrary}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 7h4l2-2h6l2 2h4v12H3zM8 14l3-3 3 3 2-2 3 3" />
        </svg>
        <b>From library</b>
        <small>Photos already used</small>
      </button>
    </div>
  );

  return (
    <div className="ef-photo">
      <input ref={file} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
      {!ref || choosing ? (
        <>
          {buttons}
          {choosing && (
            <button type="button" className="ef-photo-link" onClick={() => setChoosing(false)}>
              Keep the current photo
            </button>
          )}
        </>
      ) : (
        <>
          <button
            type="button"
            className={`ef-photo-view${focusing ? " focusing" : ""}`}
            aria-label={focusing ? "Tap the most important part of the photo" : "Photo"}
            disabled={!focusing}
            onClick={setFocus}
          >
            <span className="ef-photo-frame">
              {/* eslint-disable-next-line @next/next/no-img-element -- Sanity's own resized picture */}
              <img src={photoUrl(ref, projectId, dataset, 900)} alt="" />
              {value?.hotspot && (
                <span className="ef-photo-ring" style={{ left: `${value.hotspot.x * 100}%`, top: `${value.hotspot.y * 100}%` }} />
              )}
            </span>
            {focusing && <span className="ef-photo-hint">Tap the most important part</span>}
          </button>
          <div className="ef-photo-actions">
            <button type="button" disabled={readOnly} onClick={() => setChoosing(true)}>
              Change
            </button>
            <button type="button" disabled={readOnly} aria-pressed={focusing} onClick={() => setFocusing((f) => !f)}>
              {focusing ? "Cancel" : "Focus point"}
            </button>
            <button type="button" className="ef-photo-remove" disabled={readOnly} onClick={() => save(unset())}>
              Remove
            </button>
          </div>
        </>
      )}
      {error && <p className="ef-photo-error">{error}</p>}

      {library &&
        createPortal(
          <div data-scheme={scheme}>
            <div className="ef-lib-back" onClick={() => setLibrary(null)}>
              <section className="ef-lib" role="dialog" aria-modal="true" aria-label="Choose a photo" onClick={(e) => e.stopPropagation()}>
                <div className="ef-lib-head">
                  <b>Choose a photo</b>
                  <button type="button" onClick={() => setLibrary(null)}>
                    Close
                  </button>
                </div>
                {library.length === 0 && <p className="ef-note">Loading photos…</p>}
                <div className="ef-lib-scroll">
                  <div className="ef-lib-grid">
                    {library.map((a) => (
                      <button key={a._id} type="button" aria-label="Use this photo" onClick={() => choose(a._id)}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- Sanity's own resized picture */}
                        <img src={`${a.url}?w=240&h=240&fit=crop&auto=format`} alt="" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

// The home page's main card: the chosen articles as numbered cards (1 is the big slide),
// moved with up/down buttons and taken off with ×. "Add an article" opens the latest
// articles in a sheet with a search box. Empty means the 5 newest show by themselves.
type Ref = { _key: string; _type: "reference"; _ref: string };
type Pick = { _id: string; title?: string; publishedAt?: string; img?: string };
const MAX_FEATURED = 8;
const newKey = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, "0")).join("");

export function FeaturedInput(props: ArrayOfObjectsInputProps) {
  const { onChange, readOnly } = props;
  const value = (props.value ?? []) as unknown as Ref[];
  const client = useClient({ apiVersion: "2025-02-19" });
  const [info, setInfo] = useState<Record<string, Pick>>({});
  const [picker, setPicker] = useState<Pick[] | null>(null);
  const [search, setSearch] = useState("");
  const [scheme, setScheme] = useState("dark");
  const ids = value.map((r) => r._ref).join(",");

  // Titles, dates and pictures of the chosen articles (a draft's title if it has one).
  useEffect(() => {
    const list = ids ? ids.split(",") : [];
    if (!list.length) return;
    client
      .fetch<Pick[]>(`*[_id in $ids]{ _id, title, publishedAt, "img": image.asset->url }`, { ids: list.concat(list.map((id) => `drafts.${id}`)) }, { perspective: "raw" })
      .then((rows) => {
        const next: Record<string, Pick> = {};
        for (const r of rows) {
          const id = r._id.replace(/^drafts\./, "");
          if (!next[id] || r._id.startsWith("drafts.")) next[id] = { ...r, _id: id };
        }
        setInfo(next);
      }, () => {});
  }, [client, ids]);

  const [error, setError] = useState("");
  // Sanity refuses changes while the page is still connecting; say so instead of doing nothing.
  const save = (next: Ref[]) => {
    try {
      onChange(next.length ? set(next) : unset());
      setError("");
    } catch (err) {
      console.warn("Main card change was not saved", err);
      setError("The page is still connecting. Wait a moment and try again.");
    }
  };
  const move = (i: number, j: number) => {
    const next = value.slice();
    [next[i], next[j]] = [next[j], next[i]];
    save(next);
  };
  const openPicker = (e: MouseEvent<HTMLElement>) => {
    setScheme(e.currentTarget.closest("[data-scheme]")?.getAttribute("data-scheme") ?? "dark");
    setSearch("");
    setPicker([]);
    client
      .fetch<Pick[]>(`*[_type == "article" && !(_id in path("drafts.**")) && defined(publishedAt)] | order(publishedAt desc)[0...60]{ _id, title, publishedAt, "img": image.asset->url }`)
      .then(setPicker, () => setPicker(null));
  };
  const add = (id: string) => {
    setPicker(null);
    if (value.length >= MAX_FEATURED || value.some((r) => r._ref === id)) return;
    save([...value, { _key: newKey(), _type: "reference", _ref: id }]);
  };

  const term = search.trim().toLowerCase();
  const choices = (picker ?? []).filter((a) => !term || (a.title ?? "").toLowerCase().includes(term));

  return (
    <div className="ef-feat">
      <span className="ef-feat-count">
        {value.length} of {MAX_FEATURED} · shown in this order on the home page
      </span>

      {value.length === 0 && <p className="ef-feat-empty">No articles chosen: the 5 newest show by themselves.</p>}

      <div className="ef-feat-list">
        {value.map((r, i) => {
          const a = info[r._ref];
          return (
            <div key={r._key} className={`ef-feat-row${i === 0 ? " first" : ""}`}>
              <span className="ef-feat-n">{i + 1}</span>
              {a?.img ? (
                // eslint-disable-next-line @next/next/no-img-element -- Sanity's own resized picture
                <img src={`${a.img}?w=128&h=128&fit=crop&auto=format`} alt="" />
              ) : (
                <span className="ef-feat-noimg" aria-hidden="true" />
              )}
              <span className="ef-feat-text">
                <span className="ef-feat-title">{a ? a.title?.trim() || "—" : "Article not found"}</span>
                {a?.publishedAt && <span className="ef-feat-date">{formatWhen(a.publishedAt)}</span>}
              </span>
              <span className="ef-feat-move">
                <button type="button" aria-label="Move up" disabled={readOnly || i === 0} onClick={() => move(i, i - 1)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 15l6-6 6 6" />
                  </svg>
                </button>
                <button type="button" aria-label="Move down" disabled={readOnly || i === value.length - 1} onClick={() => move(i, i + 1)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </span>
              <button
                type="button"
                className="ef-feat-x"
                aria-label="Take off the main card"
                disabled={readOnly}
                onClick={() => save(value.filter((x) => x._key !== r._key))}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      <button type="button" className="ef-feat-add" disabled={readOnly || value.length >= MAX_FEATURED} onClick={openPicker}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {value.length >= MAX_FEATURED ? "The card is full (8)" : "Add an article"}
      </button>

      {error && <p className="ef-photo-error">{error}</p>}
      <p className="ef-feat-note">The first one is the big slide. Leave the list empty and the 5 newest articles show by themselves.</p>

      {picker &&
        createPortal(
          <div data-scheme={scheme}>
            <div className="ef-lib-back" onClick={() => setPicker(null)}>
              <section className="ef-lib" role="dialog" aria-modal="true" aria-label="Add to the main card" onClick={(e) => e.stopPropagation()}>
                <div className="ef-lib-head">
                  <b>Add to the main card</b>
                  <button type="button" onClick={() => setPicker(null)}>
                    Close
                  </button>
                </div>
                <label className="ef-feat-search">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M4 11a7 7 0 1 0 14 0a7 7 0 1 0-14 0M16 16l4 4" />
                  </svg>
                  <input type="search" placeholder="Search articles" value={search} onChange={(e) => setSearch(e.target.value)} />
                </label>
                {picker.length === 0 && <p className="ef-note">Loading articles…</p>}
                <div className="ef-lib-scroll">
                  {choices.map((a) => {
                    const chosen = value.some((r) => r._ref === a._id);
                    return (
                      <div key={a._id} className="ef-feat-pick">
                        {a.img ? (
                          // eslint-disable-next-line @next/next/no-img-element -- Sanity's own resized picture
                          <img src={`${a.img}?w=100&h=100&fit=crop&auto=format`} alt="" />
                        ) : (
                          <span className="ef-feat-noimg" aria-hidden="true" />
                        )}
                        <span className="ef-feat-text">
                          <span className="ef-feat-title one">{a.title?.trim() || "—"}</span>
                          <span className="ef-feat-date">{formatWhen(a.publishedAt)}</span>
                        </span>
                        <button type="button" className={chosen ? "added" : ""} disabled={chosen} onClick={() => add(a._id)}>
                          {chosen ? "✓ Added" : "+ Add"}
                        </button>
                      </div>
                    );
                  })}
                  {picker.length > 0 && choices.length === 0 && <p className="ef-note">Nothing matches your search.</p>}
                </div>
              </section>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

// Poll under the article: one round button per poll still taking votes, plus
// "no poll". A chosen poll that has since ended stays listed so the choice is visible.
type PollRow = { _id: string; title?: string; closesAt?: string; answers?: number };
function pollMeta(p: PollRow, now: number) {
  const answers = `${p.answers ?? 0} answers`;
  if (!p.closesAt) return `${answers} · no end time`;
  const ms = Date.parse(p.closesAt) - now;
  if (ms <= 0) return `${answers} · voting ended`;
  const h = Math.ceil(ms / 3600000);
  return `${answers} · ends in ${h < 48 ? `${h} hour${h === 1 ? "" : "s"}` : `${Math.round(h / 24)} days`}`;
}
export function PollPickInput(props: ReferenceInputProps) {
  const { value, onChange, readOnly } = props;
  const client = useClient({ apiVersion: "2025-02-19" });
  const [polls, setPolls] = useState<PollRow[] | null>(null);
  const [now] = useState(() => Date.now());
  const [error, setError] = useState("");
  useEffect(() => {
    client
      .fetch<PollRow[]>(`*[_type == "poll" && !(_id in path("drafts.**"))] | order(_createdAt desc){ _id, title, closesAt, "answers": count(options) }`)
      .then(setPolls, () => setPolls([]));
  }, [client]);
  if (!polls) return <p className="ef-note">Loading polls…</p>;
  const shown = polls.filter((p) => p._id === value?._ref || !p.closesAt || Date.parse(p.closesAt) > now);
  // Sanity refuses changes while the page is still connecting; say so instead of doing nothing.
  const pick = (id: string | null) => {
    try {
      onChange(id ? set({ _type: "reference", _ref: id, _weak: true }) : unset());
      setError("");
    } catch {
      setError("The page is still connecting. Wait a moment and try again.");
    }
  };
  return (
    <div className="ef-chips ef-polls" role="radiogroup">
      <button type="button" role="radio" aria-checked={!value?._ref} className="ef-chip ef-poll" disabled={readOnly} onClick={() => value?._ref && pick(null)}>
        {!value?._ref && <Check />}
        <span className="ef-poll-q">ޕޯލެއް ނުދައްކާ</span>
      </button>
      {shown.map((p) => {
        const on = value?._ref === p._id;
        return (
          <button key={p._id} type="button" role="radio" aria-checked={on} className="ef-chip ef-poll" disabled={readOnly} onClick={() => !on && pick(p._id)}>
            {on && <Check />}
            <span className="ef-poll-text">
              <span className="ef-poll-q">{p.title ?? "—"}</span>
              <span className="ef-poll-meta">{pollMeta(p, now)}</span>
            </span>
          </button>
        );
      })}
      {shown.length === 0 && <p className="ef-note">No poll is taking votes right now. Make one under ޕޯލްސް first.</p>}
      {error && <p className="ef-photo-error">{error}</p>}
    </div>
  );
}

// Audio of the article read aloud: record it with the phone's microphone or pick a
// sound file. The website shows a play button on the photo when there is one.
export const AUDIO_TYPES = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm"];
export const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function fileUrl(ref: string, projectId: string, dataset: string) {
  const [, id, ext] = ref.split("-");
  return `https://cdn.sanity.io/files/${projectId}/${dataset}/${id}.${ext}`;
}

export function AudioInput(props: ObjectInputProps) {
  const { onChange, readOnly } = props;
  const ref = (props.value as { asset?: { _ref?: string } } | undefined)?.asset?._ref;
  const client = useClient({ apiVersion: "2025-02-19" });
  const { projectId = "", dataset = "" } = client.config();
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [changing, setChanging] = useState(false);
  // Recording: the live recorder, seconds so far, and the finished take to check first.
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [take, setTake] = useState<{ blob: Blob; url: string } | null>(null);

  useEffect(() => {
    if (!recorder) return;
    const started = Date.now();
    const tick = setInterval(() => setSeconds((Date.now() - started) / 1000), 250);
    return () => clearInterval(tick);
  }, [recorder]);
  useEffect(
    () => () => {
      if (take) URL.revokeObjectURL(take.url);
    },
    [take],
  );

  const upload = async (file: Blob, name: string) => {
    setBusy(true);
    setError("");
    try {
      const asset = await client.assets.upload("file", file, { filename: name, contentType: file.type });
      try {
        onChange(set({ _type: "file", asset: { _type: "reference", _ref: asset._id } }));
        setTake(null);
        setChanging(false);
      } catch {
        setError("The page is still connecting. Wait a moment and try again.");
      }
    } catch {
      setError("The audio couldn't be uploaded. Check the connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const record = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = AUDIO_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
      const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      const parts: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(parts, { type: rec.mimeType || "audio/mp4" });
        setTake({ blob, url: URL.createObjectURL(blob) });
        setRecorder(null);
      };
      rec.start(1000);
      setSeconds(0);
      setTake(null);
      setRecorder(rec);
    } catch {
      setError("The microphone couldn't be used. Allow microphone access for this site and try again.");
    }
  };

  const pick = (
    <div className="ef-photo-pick">
      <button type="button" className="ef-photo-phone" disabled={readOnly || busy} onClick={record}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0zM5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
        <b>Record</b>
        <small>Read the article aloud</small>
      </button>
      <button type="button" className="ef-photo-lib" disabled={readOnly || busy} onClick={() => fileInput?.click()}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18V6l11-2v12M9 18a3 3 0 1 1-6 0a3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0a3 3 0 0 1 6 0z" />
        </svg>
        <b>{busy ? "Uploading…" : "From phone"}</b>
        <small>A sound file</small>
      </button>
    </div>
  );

  return (
    <div className="ef-photo ef-audio">
      <input
        ref={setFileInput}
        type="file"
        accept="audio/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f, f.name);
          e.target.value = "";
        }}
      />
      {recorder ? (
        <div className="ef-rec">
          <span className="ef-rec-dot" aria-hidden="true" />
          <b className="ef-rec-time">{clock(seconds)}</b>
          <span className="ef-note">Recording… read the article, then tap Stop.</span>
          <button type="button" className="ef-rec-stop" onClick={() => recorder.stop()}>
            Stop
          </button>
        </div>
      ) : take ? (
        <>
          <audio className="ef-audio-player" controls src={take.url} />
          <div className="ef-photo-actions ef-audio-actions">
            <button type="button" disabled={busy} onClick={record}>
              Record again
            </button>
            <button type="button" aria-pressed="true" disabled={busy} onClick={() => upload(take.blob, `article-audio.${take.blob.type.includes("webm") ? "webm" : "m4a"}`)}>
              {busy ? "Uploading…" : "Use this"}
            </button>
          </div>
        </>
      ) : ref && !changing ? (
        <>
          <audio className="ef-audio-player" controls preload="metadata" src={fileUrl(ref, projectId, dataset)} />
          <div className="ef-photo-actions ef-audio-actions">
            <button type="button" disabled={readOnly} onClick={() => setChanging(true)}>
              Change
            </button>
            <button
              type="button"
              className="ef-photo-remove"
              disabled={readOnly}
              onClick={() => {
                try {
                  onChange(unset());
                } catch {
                  setError("The page is still connecting. Wait a moment and try again.");
                }
              }}
            >
              Remove
            </button>
          </div>
        </>
      ) : (
        <>
          {pick}
          {changing && (
            <button type="button" className="ef-photo-link" onClick={() => setChanging(false)}>
              Keep the current audio
            </button>
          )}
        </>
      )}
      {error && <p className="ef-photo-error">{error}</p>}
    </div>
  );
}
