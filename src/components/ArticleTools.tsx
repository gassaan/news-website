"use client";

import Link from "next/link";
import { getAuthorSlug } from "@/lib/articles";
import { getAuthorPhoto } from "@/lib/authorPhotos";
import ArticleImage from "./ArticleImage";

// The writer's capsule and the text size buttons. The buttons tell the article text
// (ArticleBody) to grow or shrink, wherever this row sits on the page.
export const zoomText = (step: 1 | -1) => window.dispatchEvent(new CustomEvent("art-zoom", { detail: step }));

export default function ArticleTools({ author }: { author: string }) {
  const authorSlug = getAuthorSlug(author);
  return (
    <div className="art-tools">
      <Link href={`/author/${authorSlug}`} className="author">
        <ArticleImage slug={`author-${authorSlug}`} src={getAuthorPhoto(authorSlug)} alt={author} className="avatar" />
        <span>{author}</span>
      </Link>
      <div className="zoom">
        <button type="button" id="zoomIn" aria-label="ލިޔުން ބޮޑުކުރޭ" className="round-btn" onClick={() => zoomText(1)}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
          </svg>
        </button>
        <button type="button" id="zoomOut" aria-label="ލިޔުން ކުޑަކުރޭ" className="round-btn" onClick={() => zoomText(-1)}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.3-4.3M8 11h6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
