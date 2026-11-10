"use client";

import { useEffect, useState } from "react";
import { apiOn, apiPost, voterId } from "@/lib/api";
import { readerSource } from "@/lib/readerSource";

// The eye counter on an article photo. With the online service connected, this
// visit is counted (once per device per day) and the live total is shown.
export default function ViewCount({ slug, initial }: { slug: string; initial: number }) {
  const [views, setViews] = useState(initial);

  // Every visit is sent: the service counts each device once a day, and also notes who
  // is reading now and where this reader came from.
  useEffect(() => {
    if (!apiOn) return;
    apiPost<{ views: number }>("/view", { slug, voter: voterId(), from: readerSource() }).then((res) => {
      if (res) setViews((v) => Math.max(v, res.views));
    });
  }, [slug]);

  return <span className="num">{views.toLocaleString("en-US")}</span>;
}
