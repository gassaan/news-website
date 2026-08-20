import Link from "next/link";
import { Article, getCategory } from "@/lib/articles";

export default function ArticleCard({ article }: { article: Article }) {
  const category = getCategory(article.category);

  return (
    <Link
      href={`/article/${article.slug}`}
      className="group flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
    >
      {category && (
        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-500">
          {category.name}
        </span>
      )}
      <h2 className="font-mv-mag-round text-lg leading-7 text-zinc-900 group-hover:underline dark:text-zinc-50">
        {article.title}
      </h2>
      <p className="line-clamp-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {article.excerpt}
      </p>
      <span className="text-xs text-zinc-400 dark:text-zinc-500">
        {article.publishedAt}
      </span>
    </Link>
  );
}
