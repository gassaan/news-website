"use client";

import { useEffect, useState } from "react";
import { apiGet, apiOn, apiPost, remember, voterId } from "@/lib/api";

// The eye counter on an article photo. With the online service connected, this
// visit is counted (once per device per day) and the live total is shown.
export default function ViewCount({ slug, initial }: { slug: string; initial: number }) {
  const [views, setViews] = useState(initial);

  useEffect(() => {
    if (!apiOn) return;
    const key = `hulhangu-viewed:${slug}`;
    const day = new Date().toISOString().slice(0, 10);
    if (remember(key) === day) {
      // Already counted today: just show the latest total.
      apiGet<Record<string, number>>(`/views?slugs=${slug}`).then((res) => {
        if (res?.[slug]) setViews((v) => Math.max(v, res[slug]));
      });
      return;
    }
    apiPost<{ views: number }>("/view", { slug, voter: voterId() }).then((res) => {
      if (!res) return;
      remember(key, day);
      setViews((v) => Math.max(v, res.views));
    });
  }, [slug]);

  return <span className="num">{views.toLocaleString("en-US")}</span>;
}
