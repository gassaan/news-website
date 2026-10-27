"use client";

import { useState } from "react";

// Safari's top bar colour for each look: the header's colour (layout.tsx theme-color).
const BAR = { dark: "#150735", light: "#3e2180" };

export default function ThemeToggle({ className = "" }: { className?: string }) {
  // The sun or moon spins in when tapped (not when the page first opens).
  const [tapped, setTapped] = useState(false);

  function toggle() {
    setTapped(true);
    const root = document.documentElement;
    const current =
      root.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    const next = current === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    // The phone's bar (Safari's) follows the site's choice, not only the phone's setting:
    // a first theme-color of its own, ahead of the layout's two (see layout.tsx).
    let bar = document.getElementById("site-bar") as HTMLMetaElement | null;
    if (!bar) {
      bar = document.createElement("meta");
      bar.name = "theme-color";
      bar.id = "site-bar";
      document.head.prepend(bar);
    }
    bar.content = BAR[next];
    try {
      localStorage.setItem("theme", next);
    } catch {
      // ignore (private browsing, storage disabled, etc.)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch light or dark mode"
      className={`theme-toggle flex items-center justify-center rounded-full ${tapped ? "spin" : ""} ${className}`}
    >
      <svg
        className="i-sun"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg
        className="i-moon"
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.48"
        strokeLinejoin="round"
      >
        {/* 1.48 at 26px shows as 1.6px on screen, the same as the menu icon. */}
        <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
      </svg>
    </button>
  );
}
