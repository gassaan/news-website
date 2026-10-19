import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import {
  set,
  unset,
  useClient,
  useFormValue,
  type BooleanInputProps,
  type FieldProps,
  type ObjectInputProps,
  type ReferenceInputProps,
  type SlugInputProps,
  type StringInputProps,
  type TextInputProps,
} from "sanity";
import { toSlug } from "../slug";
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

// Article text: the normal box with the number of words and reading time.
export function BodyInput(props: TextInputProps) {
  const words = (props.value ?? "").trim().split(/\s+/).filter(Boolean).length;
  return (
    <div className="ef-stack">
      {props.renderDefault(props)}
      {words > 0 && (
        <div className="ef-count">
          <span>
            {words} word{words === 1 ? "" : "s"} · {Math.max(1, Math.round(words / 200))} min read
          </span>
        </div>
      )}
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

function photoUrl(ref: string, projectId: string, dataset: string, width: number) {
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
