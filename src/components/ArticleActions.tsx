"use client";

import { useEffect, useRef, useState } from "react";
import ShareImage from "./ShareImage";

export default function ArticleActions({
  title,
  slug,
  summary,
  date,
}: {
  title: string;
  slug: string;
  summary: string;
  date: string;
}) {
  const [toastVisible, setToastVisible] = useState(false);
  // The share button opens a small strip: Facebook, X and copy link.
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shareOpen) return;
    const away = (e: PointerEvent) => {
      if (!shareRef.current?.contains(e.target as Node)) setShareOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setShareOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [shareOpen]);

  function openShare(site: "facebook" | "x") {
    const url = encodeURIComponent(window.location.href);
    const href =
      site === "facebook"
        ? `https://www.facebook.com/sharer/sharer.php?u=${url}`
        : `https://x.com/intent/post?url=${url}&text=${encodeURIComponent(title)}`;
    window.open(href, "_blank", "noopener,noreferrer");
    setShareOpen(false);
  }

  async function copyLink() {
    setShareOpen(false);
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2000);
    } catch {
      window.prompt("ލިންކު:", window.location.href);
    }
  }

  function jumpToComments(e: React.MouseEvent) {
    e.preventDefault();
    const form = document.getElementById("commentForm");
    form?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => document.getElementById("cName")?.focus({ preventScroll: true }), 400);
  }

  return (
    <>
      <div className="art-actions">
        <a className="round-btn" href="#commentForm" id="toComments" aria-label="ކޮމެންޓް ކުރައްވާ" onClick={jumpToComments}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.6-5A8.5 8.5 0 1 1 21 11.5z" />
            <path d="M8.5 11.5h.01M12.5 11.5h.01M16.5 11.5h.01" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </a>
        <div className="share-wrap" ref={shareRef}>
          {shareOpen && (
            <div className="share-pop" role="menu" aria-label="ޝެއަރ ކުރައްވާ">
              <button type="button" role="menuitem" aria-label="ފޭސްބުކް" onClick={() => openShare("facebook")}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M15.12 5.32H17V2.14A26 26 0 0 0 14.26 2c-2.72 0-4.58 1.66-4.58 4.7v2.62H6.61v3.56h3.07V22h3.68v-9.12h3.06l.46-3.56h-3.52V7.05c0-1.03.28-1.73 1.76-1.73z" />
                </svg>
              </button>
              <button type="button" role="menuitem" aria-label="އެކްސް" onClick={() => openShare("x")}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3zm-1.08 16.2h1.7L7.4 4.73H5.58l11.09 14.47z" />
                </svg>
              </button>
              <button type="button" role="menuitem" aria-label="ލިންކު ކޮޕީ ކުރައްވާ" onClick={copyLink}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L11.6 6" />
                  <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.6-1.6" />
                </svg>
              </button>
            </div>
          )}
          <button
            type="button"
            className="round-btn"
            id="shareBtn"
            aria-label="ޝެއަރ ކުރައްވާ"
            aria-haspopup="menu"
            aria-expanded={shareOpen}
            onClick={() => setShareOpen((o) => !o)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
            </svg>
          </button>
        </div>
        <ShareImage slug={slug} title={title} summary={summary} date={date} />
      </div>
      <p className="toast" id="toast" role="status" hidden={!toastVisible}>
        ލިންކު ކޮޕީ ކުރެވިއްޖެ
      </p>
    </>
  );
}
