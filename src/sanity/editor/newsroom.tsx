import { useEffect, useState } from "react";
import { useClient, useDocumentOperation, useFormValue, type DocumentActionDescription, type DocumentActionProps, type StringInputProps, type TextInputProps } from "sanity";
import { ChoiceInput, photoUrl } from "./inputs";
import { useIsEditor } from "../roles";
import { API_URL } from "../../lib/api";
import { plainText } from "../../lib/richText";

// The site's public address (as in lib/share.ts, without loading the site's picture list).
const SITE_URL = `https://gassaan.github.io${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`;

// Article stages the team moves an article through before it's published.
export const STAGE_OPTIONS = [
  { title: "ލިޔަނީ", value: "writing" },
  { title: "އެޑިޓަށް ތައްޔާރު", value: "ready" },
  { title: "އެޕްރޫވް ކުރެވިއްޖެ", value: "approved" },
];
export const STAGE_EN: Record<string, string> = { writing: "Writing", ready: "Ready for edit", approved: "Approved" };

type Doc = {
  title?: string;
  category?: string;
  author?: { _ref?: string };
  image?: { asset?: { _ref?: string } };
  photoCredit?: string;
  excerpt?: string;
  body?: string;
  stage?: string;
};

const HEADLINE_MAX = 90;
const SUMMARY_MAX = 250;
const MIN_WORDS = 50;

// Ready to publish: ticks itself as the article is filled in. Red items stop publishing
// (Sanity asks for them too); amber ones are worth a look but don't stop it.
export function ChecklistInput() {
  const doc = (useFormValue([]) ?? {}) as Doc;
  const title = doc.title?.trim() ?? "";
  const summary = doc.excerpt?.trim() ?? "";
  const words = plainText((doc.body ?? "").split("\n")).split(/\s+/).filter(Boolean).length;

  const checks: { ok: boolean; must: boolean; text: string; hint?: string }[] = [
    { ok: Boolean(title), must: true, text: "Headline" },
    ...(title.length > HEADLINE_MAX
      ? [{ ok: false, must: false, text: "Headline is long", hint: `${title.length} letters; over ${HEADLINE_MAX} gets cut on the share picture` }]
      : []),
    { ok: Boolean(doc.category), must: true, text: "Category" },
    { ok: Boolean(doc.author?._ref), must: true, text: "Writer" },
    { ok: Boolean(doc.image?.asset?._ref), must: true, text: "Main photo" },
    { ok: Boolean(doc.photoCredit?.trim()), must: false, text: "Photo credit", hint: "Who took or supplied the photo" },
    {
      ok: Boolean(summary) && summary.length <= SUMMARY_MAX,
      must: false,
      text: "Summary",
      hint: summary.length > SUMMARY_MAX ? `${summary.length} letters; keep it under ${SUMMARY_MAX}` : "Shown on the home page and the share picture",
    },
    { ok: words >= MIN_WORDS, must: words === 0, text: "Article text", hint: words ? `${words} words so far` : undefined },
    { ok: doc.stage === "approved", must: false, text: "Approved by an editor", hint: "Set the status at the top to Approved" },
  ];
  const missing = checks.filter((c) => !c.ok);
  const blocking = missing.filter((c) => c.must).length;

  return (
    <div className="nr-check">
      <p className={`nr-check-sum ${blocking ? "bad" : missing.length ? "warn" : "ok"}`}>
        {blocking
          ? `${blocking} thing${blocking === 1 ? "" : "s"} needed before publishing`
          : missing.length
            ? `Ready to publish · ${missing.length} thing${missing.length === 1 ? "" : "s"} to check`
            : "Ready to publish"}
      </p>
      <ul>
        {checks.map((c) => (
          <li key={c.text} className={c.ok ? "ok" : c.must ? "bad" : "warn"}>
            <span className="nr-mark" aria-hidden="true">
              {c.ok ? "✓" : c.must ? "!" : "–"}
            </span>
            <span className="nr-what">
              <b>{c.text}</b>
              {!c.ok && c.hint && <small>{c.hint}</small>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Stats = { week?: Record<string, number>; month?: Record<string, number> };
const cleanSlug = (slug: string) => slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

// How a published article is doing: reads (all time, this week, this month) and comments.
export function StatsInput() {
  const client = useClient({ apiVersion: "2025-02-19" });
  const id = String(useFormValue(["_id"]) ?? "").replace(/^drafts\./, "");
  const slug = String((useFormValue(["slug"]) as { current?: string } | undefined)?.current ?? "");
  const [published, setPublished] = useState<boolean | null>(null);
  const [nums, setNums] = useState<{ total?: number; week?: number; month?: number; approved?: number; waiting?: number }>({});

  useEffect(() => {
    if (!id) return;
    let live = true;
    client
      .fetch<{ pub: boolean; approved: number; waiting: number }>(
        `{
          "pub": defined(*[_id == $id][0]._id),
          "approved": count(*[_type == "comment" && target == $slug && !(_id in path("drafts.**"))]),
          "waiting": count(*[_type == "comment" && target == $slug && _id in path("drafts.**")])
        }`,
        { id, slug },
        { perspective: "raw" },
      )
      .then((r) => {
        if (!live) return;
        setPublished(r.pub);
        setNums((n) => ({ ...n, approved: r.approved, waiting: r.waiting }));
      }, () => live && setPublished(false));
    if (API_URL && slug) {
      const key = cleanSlug(slug);
      fetch(`${API_URL}/views?slugs=${encodeURIComponent(key)}`)
        .then((r) => (r.ok ? r.json() : {}))
        .then((v: Record<string, number>) => live && setNums((n) => ({ ...n, total: v[key] ?? 0 })), () => {});
      fetch(`${API_URL}/stats`)
        .then((r) => (r.ok ? r.json() : null))
        .then((s: Stats | null) => {
          if (!live || !s) return;
          setNums((n) => ({ ...n, week: s.week?.[slug] ?? s.week?.[key] ?? 0, month: s.month?.[slug] ?? s.month?.[key] ?? 0 }));
        }, () => {});
    }
    return () => {
      live = false;
    };
  }, [client, id, slug]);

  if (published === null) return <p className="ef-note">Loading…</p>;
  if (!published) return <p className="ef-note">Reads and comments for this article will show here once it&apos;s published.</p>;

  const tiles = [
    { label: "Reads, all time", value: nums.total },
    { label: "Last 7 days", value: nums.week },
    { label: "Last 30 days", value: nums.month },
    { label: "Comments", value: nums.approved, more: nums.waiting ? `+${nums.waiting} waiting` : undefined },
  ];
  return (
    <div className="nr-stats">
      <div className="nr-tiles">
        {tiles.map((t) => (
          <div key={t.label} className="nr-tile">
            <span className="nr-tile-v">{t.value === undefined ? "…" : fmt(t.value)}</span>
            <span className="nr-tile-l">{t.label}</span>
            {t.more && <span className="nr-tile-more">{t.more}</span>}
          </div>
        ))}
      </div>
      {slug && (
        <a className="nr-link" href={`${SITE_URL}/article/${slug}/`} target="_blank" rel="noopener noreferrer">
          Open on the website ↗
        </a>
      )}
    </div>
  );
}

type FbDoc = {
  title?: string;
  excerpt?: string;
  facebookText?: string;
  facebookImage?: string;
  sensitivePhoto?: boolean;
  image?: { asset?: { _ref?: string } };
  poster?: { asset?: { _ref?: string } };
};

// The Facebook caption box, with a preview of the post below it: the page, the text
// (or the headline and summary when the box is left empty) and the link card.
export function FacebookTextInput(props: TextInputProps) {
  const client = useClient({ apiVersion: "2025-02-19" });
  const { projectId = "", dataset = "" } = client.config();
  const doc = (useFormValue([]) ?? {}) as FbDoc;
  const own = (props.value ?? "").trim();
  const text = own || [doc.title, doc.excerpt].filter(Boolean).join("\n\n");
  const ref = (doc.image ?? doc.poster)?.asset?._ref;
  const photo = ref ? `${photoUrl(ref, projectId, dataset, 800)}${doc.sensitivePhoto ? "&blur=120" : ""}` : "";
  const card = doc.facebookImage === "card";
  // Facebook folds long posts after about three lines on phones.
  const folds = text.split("\n").length > 3 || text.length > 240;
  return (
    <div className="ef-stack">
      {props.renderDefault(props)}
      <p className="ef-note">How the post will look on Facebook:</p>
      <div className="fbp" dir="rtl">
        <div className="fbp-head">
          <span className="fbp-av">H</span>
          <span className="fbp-who">
            <b>Hulhangu</b>
            <small>Just now · 🌐</small>
          </span>
        </div>
        <p className={`fbp-text${folds ? " folds" : ""}`}>{text || "…"}</p>
        {folds && <span className="fbp-more">See more</span>}
        {card ? (
          <div className="fbp-card-pic">The share picture (headline, summary and photo)</div>
        ) : (
          <div className="fbp-link" dir="ltr">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element -- Sanity's own resized picture
              <img src={photo} alt="" />
            ) : (
              <div className="fbp-nopic">No main photo yet</div>
            )}
            <div className="fbp-link-meta">
              <small>GASSAAN.GITHUB.IO</small>
              <b dir="rtl">{doc.title || "…"}</b>
            </div>
          </div>
        )}
      </div>
      {!own && <p className="ef-note">The box is empty, so the headline and summary are used.</p>}
    </div>
  );
}

// Writers send a finished article to an editor (its status becomes Ready for edit)
// instead of publishing it themselves.
export function SendToEditorAction(props: DocumentActionProps): DocumentActionDescription {
  const { patch } = useDocumentOperation(props.id, props.type);
  const doc = (props.draft ?? props.published) as { stage?: string } | null;
  const sent = doc?.stage === "ready" || doc?.stage === "approved";
  return {
    label: sent ? (doc?.stage === "approved" ? "Approved by an editor" : "Sent to an editor") : "Send to editor",
    tone: "primary",
    disabled: sent || !props.draft,
    title: props.draft ? undefined : "Write or change something first",
    onHandle: () => {
      patch.execute([{ set: { stage: "ready" } }]);
      props.onComplete();
    },
  };
}

// Article status buttons: only editors can mark an article Approved.
export function StageInput(props: StringInputProps) {
  const editor = useIsEditor();
  const list = props.schemaType.options?.list ?? [];
  const shown = editor ? list : list.filter((o) => typeof o === "string" || o.value !== "approved" || props.value === "approved");
  return (
    <div className="ef-stack">
      <ChoiceInput {...props} schemaType={{ ...props.schemaType, options: { ...props.schemaType.options, list: shown } }} />
      {!editor && <p className="ef-note">An editor marks the article Approved and publishes it.</p>}
    </div>
  );
}
