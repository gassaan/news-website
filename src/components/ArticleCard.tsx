import Link from "next/link";
import { Article, getCategory } from "@/lib/articles";
import NewsIllustration from "./NewsIllustration";

export default function ArticleCard({ article }: { article: Article }) {
  const category = getCategory(article.category);

  return (
    <Link
      href={`/article/${article.slug}`}
      className="group border-accent-soft/40 hover:border-accent/60 flex flex-col rounded-lg border p-4 transition-colors"
    >
      <div className="mb-4">
        <NewsIllustration category={article.category} />
      </div>

      {category && (
        <span className="bg-accent-soft/40 text-accent inline-block w-fit rounded-full px-2.5 py-1 text-xs font-semibold">
          {category.name}
        </span>
      )}

      <h2 className="font-mv-mag-round text-foreground mt-3 text-lg leading-7 group-hover:underline">
        {article.title}
      </h2>
      <p className="text-muted mt-2 line-clamp-2 text-sm leading-6">
        {article.excerpt}
      </p>

      <span className="text-muted/70 mt-4 text-xs">
        {article.publishedAt}
      </span>
    </Link>
  );
}
