"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";
import { apiOn, apiPost, voterId } from "@/lib/api";
import Link from "next/link";
import { getAuthorSlug } from "@/lib/articles";
import { getAuthorPhoto } from "@/lib/authorPhotos";
import { parseBlocks } from "@/lib/richText";
import ArticleImage from "./ArticleImage";
import { RichBlock } from "./RichBlocks";
import ReadProgress from "./ReadProgress";

export default function ArticleBody({
  slug,
  paragraphs,
  author,
  ad,
  countRead = false,
}: {
  slug: string;
  paragraphs: string[];
  author: string;
  // The advert inside the article (from the newsroom's Ads), when there is one.
  ad?: ReactNode;
  // Articles only: noted once the reader reaches the last paragraph ("read to the end").
  countRead?: boolean;
}) {
  const [scale, setScale] = useState(1);

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
  const authorSlug = getAuthorSlug(author);
  // Lines from the dashboard, with their sub-headings, quotes, lists, photos and videos.
  const blocks = parseBlocks(paragraphs);
  // The advert goes after the first paragraph, wherever it is.
  const firstText = Math.max(0, blocks.findIndex((b) => b.type === "p"));

  return (
    <>
      <div className="art-tools">
        <Link href={`/author/${authorSlug}`} className="author">
          <ArticleImage slug={`author-${authorSlug}`} src={getAuthorPhoto(authorSlug)} alt={author} className="avatar" />
          <span>{author}</span>
        </Link>
        <div className="zoom">
          <button
            type="button"
            id="zoomIn"
            aria-label="ލިޔުން ބޮޑުކުރޭ"
            className="round-btn"
            onClick={() => setScale((s) => Math.min(1.5, s + 0.1))}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
            </svg>
          </button>
          <button
            type="button"
            id="zoomOut"
            aria-label="ލިޔުން ކުޑަކުރޭ"
            className="round-btn"
            onClick={() => setScale((s) => Math.max(0.8, s - 0.1))}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.3-4.3M8 11h6" />
            </svg>
          </button>
        </div>
      </div>

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
