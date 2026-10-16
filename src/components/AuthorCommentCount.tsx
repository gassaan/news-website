"use client";

import { useEffect, useState } from "react";
import { apiOn } from "@/lib/api";
import project from "@/sanity/project.json";

// Approved comments on an author's articles. Starts from the number at build time,
// then asks the dashboard (Sanity) for the current one, so a comment counts as soon
// as an editor publishes it.
const QUERY = `count(*[_type == "comment" && kind == "article" && target in $t])`;

export default function AuthorCommentCount({ slugs, initial }: { slugs: string[]; initial: number }) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    if (!apiOn || slugs.length === 0) return;
    const url =
      `https://${project.projectId}.apicdn.sanity.io/v2025-02-19/data/query/${project.dataset}` +
      `?query=${encodeURIComponent(QUERY)}&%24t=${encodeURIComponent(JSON.stringify(slugs))}`;
    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (typeof data?.result === "number") setCount(data.result);
      })
      .catch(() => {});
  }, [slugs]);

  return <span className="num">{count.toLocaleString("en-US")}</span>;
}
