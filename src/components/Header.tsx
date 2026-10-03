"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { categories } from "@/lib/articles";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const mobileNavRef = useRef<HTMLElement>(null);
  const mobileNavInnerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Both search boxes open the results page with what was typed.
  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.querySelector("input");
    const q = input?.value.trim() ?? "";
    if (!q) return;
    input?.blur();
    setSearchOpen(false);
    setMenuOpen(false);
    router.push(`/search/?q=${encodeURIComponent(q)}`);
  }

  function toggleMenu() {
    if (mobileNavRef.current && mobileNavInnerRef.current) {
      mobileNavRef.current.style.setProperty(
        "--menu-h",
        `${mobileNavInnerRef.current.scrollHeight}px`,
      );
    }
    setMenuOpen((v) => !v);
  }

  return (
    <header className="site">
      <div className="wrap">
        <div className="bar">
          <Link href="/" aria-label="Hulhangu home" className="logo">
            <Logo className="h-8" />
          </Link>

          <nav className="main" aria-label="Main">
            <Link href="/#latest">ފަހުގެ ޚަބަރު</Link>
            <Link href="/#popular">އެންމެ މަގުބޫލް</Link>
            <Link href="/polls">ޕޯލްސް</Link>
            <Link href="/gallery">ގެލެރީ</Link>
            <Link href={`/category/${categories[0].slug}`}>
              ކެޓެގަރީ
              <svg
                width="14"
                height="8"
                viewBox="0 0 14 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M1 1l6 6 6-6" />
              </svg>
            </Link>
          </nav>

          <div className="tools">
            <ThemeToggle className="icon-btn" />
            <span className="sep" />
            <button
              type="button"
              className="icon-btn"
              id="searchBtn"
              aria-label="Search"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((v) => !v)}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
            </button>
            <button
              type="button"
              className="icon-btn menu-btn"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={toggleMenu}
            >
              <svg
                className="i-open"
                width="24"
                height="18"
                viewBox="0 0 24 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <path d="M1 1h22M1 9h22M1 17h22" />
              </svg>
              <svg
                className="i-close"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M2 2l16 16M18 2L2 18" />
              </svg>
            </button>
          </div>
        </div>

        <form
          className={`searchbox ${searchOpen ? "open" : ""}`}
          role="search"
          onSubmit={submitSearch}
        >
          <label htmlFor="q">
            <button type="submit" className="search-go" aria-label="ހޯދާ">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
            </button>
            <input
              id="q"
              name="q"
              type="search"
              enterKeyHint="search"
              placeholder="ހޯދަން ބޭނުންވާ އެއްޗެއް ލިޔެލާ....."
            />
          </label>
        </form>

        <nav
          className={`mobile-nav ${menuOpen ? "open" : ""}`}
          aria-label="Mobile"
          ref={mobileNavRef}
        >
          <div className="mobile-nav-inner" ref={mobileNavInnerRef}>
            <form role="search" onSubmit={submitSearch}>
              <label className="m-search" htmlFor="mq">
                <input
                  id="mq"
                  name="q"
                  type="search"
                  enterKeyHint="search"
                  placeholder="ހޯދާ"
                />
                <button type="submit" className="search-go" aria-label="ހޯދާ">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                </button>
              </label>
            </form>
            <Link href="/#latest" onClick={() => setMenuOpen(false)}>
              ފަހުގެ ޚަބަރު
            </Link>
            <Link href="/#popular" onClick={() => setMenuOpen(false)}>
              އެންމެ މަގުބޫލް
            </Link>
            <Link href="/polls" onClick={() => setMenuOpen(false)}>
              ޕޯލްސް
            </Link>
            <Link href="/gallery" onClick={() => setMenuOpen(false)}>
              ގެލެރީ
            </Link>
            <Link
              href={`/category/${categories[0].slug}`}
              onClick={() => setMenuOpen(false)}
            >
              ކެޓެގަރީ
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
