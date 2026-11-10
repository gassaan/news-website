import { useEffect, useState } from "react";
import { set, unset, useClient, useFormValue, type ArrayOfPrimitivesInputProps } from "sanity";
import { API_URL } from "../../lib/api";
import { useIsEditor } from "../roles";

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
export function useAdStats(ids: string[]) {
  const client = useClient({ apiVersion: "2025-02-19" });
  const token = client.config().token;
  const editor = useIsEditor();
  const key = ids.join(",");
  const [stats, setStats] = useState<Record<string, { seen: number; taps: number; first?: string }> | null>(null);
  useEffect(() => {
    if (!API_URL || !token || !editor || !key) return;
    let live = true;
    fetch(`${API_URL}/ads/stats?ids=${encodeURIComponent(key)}`, { cache: "no-store", headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : {}))
      .then((s) => live && setStats(s), () => live && setStats({}));
    return () => {
      live = false;
    };
  }, [key, token, editor]);
  return { stats, editor };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const shortDay = (iso: string) => {
  const d = new Date(Date.parse(iso.length === 10 ? `${iso}T00:00:00Z` : iso) + (iso.length === 10 ? 0 : 5 * 3600000));
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};

export function AdStatsInput() {
  const id = String(useFormValue(["_id"]) ?? "").replace(/^drafts\./, "");
  const { stats, editor } = useAdStats(id ? [id] : []);
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
      <p className="ef-note">
        {s.first ? `Since ${shortDay(s.first)}. ` : ""}Each person counts once a day. Share these numbers with the advertiser at the end of the campaign.
      </p>
    </div>
  );
}
