import Link from "next/link";
import { categories } from "@/lib/articles";

export default function Header() {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:px-6">
        <Link href="/" className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          ދިވެހި ޚަބަރު
        </Link>
        <nav className="-mx-1 flex flex-wrap gap-1 text-sm">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="rounded-full px-3 py-1.5 font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
            >
              {category.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
