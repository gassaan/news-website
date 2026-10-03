"use client";

import { useState } from "react";

export default function ArticleActions({ title }: { title: string }) {
  const [toastVisible, setToastVisible] = useState(false);

  async function share() {
    const data = { title, url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
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
        <button type="button" className="round-btn" id="shareBtn" aria-label="ޝެއަރ ކުރައްވާ" onClick={share}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
          </svg>
        </button>
      </div>
      <p className="toast" id="toast" role="status" hidden={!toastVisible}>
        ލިންކު ކޮޕީ ކުރެވިއްޖެ
      </p>
    </>
  );
}
