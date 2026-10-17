"use client";

import { useEffect, useState } from "react";
import { apiGet, apiOn } from "@/lib/api";

// Total reads across an author's articles. Starts from the numbers at build time,
// then adds up the live totals from the site's online service.
export default function AuthorViewCount({ slugs, initial }: { slugs: string[]; initial: number }) {
  const [views, setViews] = useState(initial);

  useEffect(() => {
    if (!apiOn || slugs.length === 0) return;
    const chunks: string[][] = [];
    for (let i = 0; i < slugs.length; i += 60) chunks.push(slugs.slice(i, i + 60));
    Promise.all(chunks.map((c) => apiGet<Record<string, number>>(`/views?slugs=${c.join(",")}`))).then((all) => {
      if (all.some((r) => !r)) return;
      const total = all.reduce((n, r) => n + Object.values(r ?? {}).reduce((a, b) => a + b, 0), 0);
      setViews((v) => Math.max(v, total));
    });
  }, [slugs]);

  return <span className="num">{views.toLocaleString("en-US")}</span>;
}
