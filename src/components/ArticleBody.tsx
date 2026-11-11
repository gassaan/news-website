"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";
import { apiOn, apiPost, voterId } from "@/lib/api";
import { parseBlocks } from "@/lib/richText";
import ArticleImage from "./ArticleImage";
import { RichBlock } from "./RichBlocks";
import ReadProgress from "./ReadProgress";
import ArticleTools from "./ArticleTools";

export default function ArticleBody({
  slug,
  paragraphs,
  author,
  ad,
  countRead = false,
  tools = true,
}: {
  slug: string;
  paragraphs: string[];
  author: string;
  // The advert inside the article (from the newsroom's Ads), when there is one.
  ad?: ReactNode;
  // Articles only: noted once the reader reaches the last paragraph ("read to the end").
  countRead?: boolean;
  // The writer and text size row above the text; false when the page shows it elsewhere.
  tools?: boolean;
}) {
  const [scale, setScale] = useState(1);
  // Text size buttons (ArticleTools), wherever they are on the page.
  useEffect(() => {
    const zoom = (e: Event) => {
      const step = (e as CustomEvent<number>).detail;
      setScale((s) => Math.round(Math.min(1.5, Math.max(0.8, s + step * 0.1)) * 10) / 10);
    };
    window.addEventListener("art-zoom", zoom);
    return () => window.removeEventListener("art-zoom", zoom);
  }, []);

  // Read to the end: the last paragraph is on screen, after at least 8 seconds on the
  // page (so a short article seen at a glance doesn't count). Sent once per visit.
  useEffect(() => {
    if (!countRead || !apiOn || typeof IntersectionObserver === "undefined") return;
    const last = [...(document.getElementById("artBody")?.children ?? [])].filter((el) => !el.classList.contains("in-ad")).pop();
    if (!last) return;
    const opened = Date.now();
    let sent = false;
    let wait: ReturnType<typeof setTimeout> | undefined;
    const send = () => {
      if (sent) return;
      sent = true;
      io.disconnect();
      apiPost("/read", { slug, voter: voterId() });
    };
    const io = new IntersectionObserver(
      (entries) => {
        clearTimeout(wait);
        if (!entries.some((e) => e.isIntersecting)) return;
        const left = 8000 - (Date.now() - opened);
        if (left <= 0) send();
        else wait = setTimeout(send, left);
      },
      { threshold: 0.6 },
    );
    io.observe(last);
    return () => {
      clearTimeout(wait);
      io.disconnect();
    };
  }, [countRead, slug]);
  // Lines from the dashboard, with their sub-headings, quotes, lists, photos and videos.
  const blocks = parseBlocks(paragraphs);
  // The advert goes after the first paragraph, wherever it is.
  const firstText = Math.max(0, blocks.findIndex((b) => b.type === "p"));

  return (
    <>
      {tools && <ArticleTools author={author} />}

      <ReadProgress targetId="artBody" />
      <div
        className="art-body"
        id="artBody"
        // --rows: on wide screens the advert sits beside every row of text (globals.css).
        style={{ fontSize: `calc(var(--fs) * ${scale})`, ["--rows" as string]: blocks.length }}
      >
        {blocks.map((block, index) => (
          <Fragment key={index}>
            <RichBlock block={block} />
            {index === firstText && (
              <figure className="in-ad">
                {ad ?? <ArticleImage slug={`${slug}-ad`} alt="" sizes="(max-width: 720px) 92vw, 570px" />}
                <small>Sponsored</small>
              </figure>
            )}
          </Fragment>
        ))}
      </div>
    </>
  );
}
