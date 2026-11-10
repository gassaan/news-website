import { useEffect, useState } from "react";
import { set, unset, useClient, useFormValue, type ArrayOfPrimitivesInputProps, type StringInputProps } from "sanity";
import { API_URL } from "../../lib/api";
import { useIsEditor } from "../roles";
import { AD_PLACES, AD_WEIGHTS, weightOf } from "../../lib/adPlaces";
import { photoUrl } from "./inputs";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

// Where to show an advert: a round button for each place, any number of them.
export function PlacesInput(props: ArrayOfPrimitivesInputProps) {
  const { onChange, readOnly, schemaType } = props;
  const value = (props.value ?? []) as string[];
  const list = ((schemaType.options?.list ?? []) as { title?: string; value?: string }[]).filter((o) => o.value);
  const toggle = (v: string) => {
    const next = value.includes(v) ? value.filter((x) => x !== v) : list.map((o) => o.value!).filter((x) => x === v || value.includes(x));
    onChange(next.length ? set(next) : unset());
  };
  return (
    <div className="ef-chips ef-choices" role="group" aria-label={schemaType.title}>
      {list.map((o) => {
        const on = value.includes(o.value!);
        return (
          <button key={o.value} type="button" aria-pressed={on} className="ef-chip" disabled={readOnly} onClick={() => toggle(o.value!)}>
            {on && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            )}
            {o.title ?? o.value}
          </button>
        );
      })}
    </div>
  );
}

// The advert's numbers from the site's online service: people who saw it and tapped
// it (each person once a day). Only the administrator's login can read them.
export type AdNums = { seen: number; taps: number; first?: string; days?: { day: string; seen: number; taps: number }[] };
export function useAdStats(ids: string[], days = false) {
  const client = useClient({ apiVersion: "2025-02-19" });
  const token = client.config().token;
  const editor = useIsEditor();
  const key = ids.join(",");
  const [stats, setStats] = useState<Record<string, AdNums> | null>(null);
  useEffect(() => {
    if (!API_URL || !token || !editor || !key) return;
    let live = true;
    fetch(`${API_URL}/ads/stats?ids=${encodeURIComponent(key)}${days ? "&days=1" : ""}`, { cache: "no-store", headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : {}))
      .then((s) => live && setStats(s), () => live && setStats({}));
    return () => {
      live = false;
    };
  }, [key, token, editor, days]);
  return { stats, editor };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const shortDay = (iso: string) => {
  const d = new Date(Date.parse(iso.length === 10 ? `${iso}T00:00:00Z` : iso) + (iso.length === 10 ? 0 : 5 * 3600000));
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};

export function AdStatsInput() {
  const id = String(useFormValue(["_id"]) ?? "").replace(/^drafts\./, "");
  const { stats, editor } = useAdStats(id ? [id] : [], true);
  if (!editor) return <p className="ef-note">Only editors can see an ad&apos;s numbers.</p>;
  if (!API_URL) return <p className="ef-note">The site&apos;s online service isn&apos;t connected.</p>;
  if (!stats) return <p className="ef-note">Loading…</p>;
  const s = stats[id];
  if (!s) return <p className="ef-note">Numbers show here once the ad is published and readers start seeing it.</p>;
  const rate = s.seen ? (s.taps / s.seen) * 100 : 0;
  const tiles = [
    { label: "people saw it", value: fmt(s.seen) },
    { label: "people tapped it", value: fmt(s.taps) },
    { label: "tap rate", value: `${rate < 10 ? rate.toFixed(1) : Math.round(rate)}%` },
  ];
  return (
    <div className="nr-stats">
      <div className="nr-tiles ad-tiles">
        {tiles.map((t) => (
          <div key={t.label} className="nr-tile">
            <span className="nr-tile-v">{t.value}</span>
            <span className="nr-tile-l">{t.label}</span>
          </div>
        ))}
      </div>
      <p className="ef-note">{s.first ? `Since ${shortDay(s.first)}. ` : ""}Each person counts once a day.</p>
      <ReportButton nums={s} />
    </div>
  );
}

// "Share report": draws the advertiser's report picture, then shows it with Share (to
// WhatsApp, Viber, email…) and Save. Sharing needs its own tap on iPhone, so it's a second button.
function ReportButton({ nums }: { nums: AdNums }) {
  const client = useClient({ apiVersion: "2025-02-19" });
  const { projectId = "", dataset = "" } = client.config();
  const name = String(useFormValue(["name"]) ?? "");
  const places = (useFormValue(["places"]) as string[] | undefined) ?? [];
  const wide = (useFormValue(["wide"]) as { asset?: { _ref?: string } } | undefined)?.asset?._ref;
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<{ file: File; url: string } | null>(null);
  const [error, setError] = useState("");
  useEffect(
    () => () => {
      if (file) URL.revokeObjectURL(file.url);
    },
    [file],
  );

  const make = async () => {
    setBusy(true);
    setError("");
    try {
      const { drawReport } = await import("./adReport");
      const blob = await drawReport({
        name,
        picture: wide ? photoUrl(wide, projectId, dataset, 520) : undefined,
        places: places.map((p) => AD_PLACES.find((x) => x.value === p)?.title ?? p),
        seen: nums.seen,
        taps: nums.taps,
        days: nums.days ?? [],
      });
      if (!blob) throw new Error("no picture");
      const safe = (name || "advert").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "advert";
      const f = new File([blob], `hulhangu-report-${safe}.png`, { type: "image/png" });
      setFile({ file: f, url: URL.createObjectURL(f) });
    } catch {
      setError("The report couldn't be made. Try again.");
    } finally {
      setBusy(false);
    }
  };
  const share = async () => {
    if (!file) return;
    try {
      if (navigator.canShare?.({ files: [file.file] })) await navigator.share({ files: [file.file], title: `Advert report – ${name}` });
      else save();
    } catch {
      // closed the share sheet
    }
  };
  const save = () => {
    if (!file) return;
    const a = document.createElement("a");
    a.href = file.url;
    a.download = file.file.name;
    a.click();
  };

  return (
    <div className="ad-report">
      {!file ? (
        <button type="button" className="ef-soft ad-report-make" disabled={busy} onClick={make}>
          {busy ? "Making the report…" : "Make report for the advertiser"}
        </button>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- the picture just drawn in this browser */}
          <img src={file.url} alt="The advertiser's report" className="ad-report-pic" />
          <div className="ad-report-btns">
            <button type="button" className="ef-soft ad-report-share" onClick={share}>
              Share report
            </button>
            <button type="button" className="ef-soft" onClick={save}>
              Save
            </button>
            <button type="button" className="ef-soft" onClick={() => setFile(null)}>
              Close
            </button>
          </div>
        </>
      )}
      {error && <p className="ef-photo-error">{error}</p>}
    </div>
  );
}

// How often the advert shows: Less / Normal / More / Most, and for each of its places,
// its share of the space next to the other adverts running there now.
type Other = { _id: string; name?: string; places?: string[]; weight?: string };
const SHARE_COLOURS = ["#5fd3a0", "#f0c04f", "#7cc9ff", "#ff8ac4", "#ffa766"];
export function WeightInput(props: StringInputProps) {
  const { value, onChange, readOnly } = props;
  const client = useClient({ apiVersion: "2025-02-19" });
  const id = String(useFormValue(["_id"]) ?? "").replace(/^drafts\./, "");
  const places = (useFormValue(["places"]) as string[] | undefined) ?? [];
  const [others, setOthers] = useState<Other[] | null>(null);
  useEffect(() => {
    let live = true;
    client
      .fetch<Other[]>(
        `*[_type == "ad" && !(_id in path("drafts.**")) && _id != $id && paused != true && startsAt <= now() && (!defined(endsAt) || endsAt > now())]{ _id, name, places, weight }`,
        { id },
      )
      .then((r) => live && setOthers(r), () => live && setOthers([]));
    return () => {
      live = false;
    };
  }, [client, id]);
  const mine = weightOf(value);
  return (
    <div className="ef-stack">
      <div className="ef-chips ef-choices ad-weights" role="radiogroup" aria-label="How often it shows">
        {AD_WEIGHTS.map((w) => {
          const on = (value ?? "normal") === w.value;
          return (
            <button key={w.value} type="button" role="radio" aria-checked={on} className="ef-chip" disabled={readOnly} onClick={() => !on && onChange(set(w.value))}>
              {w.title}
            </button>
          );
        })}
      </div>
      {others &&
        places.map((place) => {
          const sharing = others.filter((o) => o.places?.includes(place));
          if (!sharing.length) return null;
          const total = mine + sharing.reduce((n, o) => n + weightOf(o.weight), 0);
          const pct = (n: number) => Math.round((n / total) * 100);
          const name = AD_PLACES.find((p) => p.value === place)?.title ?? place;
          return (
            <div key={place} className="ad-share">
              <p className="ef-note">
                <b>{name}</b>: this ad shows about <b>{pct(mine)}%</b> of the time, shared with {sharing.length} other ad{sharing.length === 1 ? "" : "s"}.
              </p>
              <div className="ad-share-bar" aria-hidden="true">
                <i style={{ width: `${pct(mine)}%`, background: "#a882ff" }} />
                {sharing.map((o, k) => (
                  <i key={o._id} style={{ width: `${pct(weightOf(o.weight))}%`, background: SHARE_COLOURS[k % SHARE_COLOURS.length] }} />
                ))}
              </div>
              <ul className="ad-share-list">
                {sharing.map((o, k) => (
                  <li key={o._id}>
                    <i style={{ background: SHARE_COLOURS[k % SHARE_COLOURS.length] }} />
                    {o.name || "Untitled ad"} · {AD_WEIGHTS.find((w) => w.value === (o.weight ?? "normal"))?.title}
                    <b>{pct(weightOf(o.weight))}%</b>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
    </div>
  );
}
