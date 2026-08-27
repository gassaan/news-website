"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { categories } from "@/lib/articles";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-nav-bg border-accent-soft/40 sticky bottom-0 z-20 overflow-x-auto border-t">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 text-sm whitespace-nowrap sm:justify-center sm:px-6">
        <Link
          href="/"
          className={`shrink-0 font-medium ${
            pathname === "/" ? "text-nav-fg" : "text-nav-fg/60"
          }`}
        >
          މައި ސަފުހާ
        </Link>
        {categories.map((category) => {
          const active = pathname === `/category/${category.slug}`;
          return (
            <span key={category.slug} className="flex items-center gap-3">
              <span className="text-nav-fg/40" aria-hidden="true">
                •
              </span>
              <Link
                href={`/category/${category.slug}`}
                className={`shrink-0 font-medium ${
                  active ? "text-nav-fg" : "text-nav-fg/60"
                }`}
              >
                {category.name}
              </Link>
            </span>
          );
        })}
      </div>
    </nav>
  );
}
