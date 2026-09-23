"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { getAuthorSlug } from "@/lib/articles";
import { getAuthorPhoto } from "@/lib/authorPhotos";
import ArticleImage from "./ArticleImage";

export default function ArticleBody({
  slug,
  paragraphs,
  author,
}: {
  slug: string;
  paragraphs: string[];
  author: string;
}) {
  const [scale, setScale] = useState(1);
  const authorSlug = getAuthorSlug(author);

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

      <div className="art-body" id="artBody" style={{ fontSize: `calc(var(--fs) * ${scale})` }}>
        {paragraphs.map((paragraph, index) => (
          <Fragment key={index}>
            <p>{paragraph}</p>
            {index === 0 && (
              <figure className="in-ad">
                <ArticleImage slug={`${slug}-ad`} alt="" />
                <small>Sponsored</small>
              </figure>
            )}
          </Fragment>
        ))}
      </div>
    </>
  );
}
