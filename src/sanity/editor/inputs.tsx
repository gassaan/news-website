import { useEffect, useState } from "react";
import {
  set,
  unset,
  useClient,
  useFormValue,
  type FieldProps,
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

// Category: one round button per choice.
export function ChoiceInput(props: StringInputProps) {
  const { value, onChange, readOnly, schemaType } = props;
  const list = (schemaType.options?.list ?? []) as { title?: string; value?: string }[];
  return (
    <div className="ef-chips" role="radiogroup">
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
    <div className="ef-chips" role="radiogroup">
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
            {w.title ?? "—"}
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
  return (
    <div className="ef-when">
      <label className="ef-pill">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 6h16v14H4zM4 10h16M9 3v4M15 3v4" />
        </svg>
        <span className="ef-sr">Date</span>
        <input type="date" value={date} disabled={readOnly} onChange={(e) => save(e.target.value, time)} />
      </label>
      <label className="ef-pill">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 7v5l3 2" />
        </svg>
        <span className="ef-sr">Time</span>
        <input type="time" value={time} disabled={readOnly || !date} onChange={(e) => save(date, e.target.value)} />
      </label>
      <button type="button" className="ef-soft" disabled={readOnly} onClick={() => onChange(set(new Date().toISOString()))}>
        Now
      </button>
      {/* A new item starts at "now", a moment after the form opens: only later times count. */}
      {d && d.getTime() > openedAt + 60000 && <span className="ef-tag">Scheduled</span>}
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
