import Link from "next/link";
import { categories } from "@/lib/articles";

const STORIES_TAB = { slug: "vaahaka", name: "ވާހަކަ" };

export default function CategoryTabs({ active }: { active: string }) {
  const tabs = [STORIES_TAB, ...categories];

  return (
    <div
      className="mb-6 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
    >
      {tabs.map((tab) => {
        const href = tab.slug === "vaahaka" ? "/stories" : `/category/${tab.slug}`;
        const isActive = tab.slug === active;
        return (
          <Link
            key={tab.slug}
            href={href}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              isActive
                ? "bg-background text-foreground border-accent-soft border"
                : "text-muted hover:bg-background/40"
            }`}
          >
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
