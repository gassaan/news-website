"use client";

import { useState } from "react";
import Link from "next/link";
import { categories } from "@/lib/articles";
import ThemeToggle from "./ThemeToggle";
import logoMask from "@/assets/logo-mask.png";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-background border-accent-soft/40 sticky top-0 z-20 border-b">
      <div
        dir="ltr"
        className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6"
      >
        <ThemeToggle />
        <Link
          href="/"
          aria-label="ދިވެހި ޚަބަރު"
          className="bg-accent dark:bg-foreground block h-8 w-24"
          style={{
            maskImage: `url(${logoMask.src})`,
            maskRepeat: "no-repeat",
            maskPosition: "center",
            maskSize: "contain",
            WebkitMaskImage: `url(${logoMask.src})`,
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            WebkitMaskSize: "contain",
          }}
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="މެނޫ ހުޅުވާ"
          aria-expanded={open}
          className="text-accent flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-accent-soft/40"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="h-5 w-5"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {open && (
        <nav className="border-accent-soft/40 border-t px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-5xl flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                onClick={() => setOpen(false)}
                className="bg-card-accent text-foreground rounded-full px-3 py-1.5 text-sm font-medium"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
