import Link from "next/link";
import { Article, getCategory } from "@/lib/articles";
import NewsIllustration from "./NewsIllustration";

export default function ArticleCard({ article }: { article: Article }) {
  const category = getCategory(article.category);

  return (
    <Link
      href={`/article/${article.slug}`}
      className="group border-accent-soft/40 hover:border-accent/60 flex flex-col rounded-lg border p-5 transition-colors"
    >
      <div className="mb-5">
        <NewsIllustration
          category={article.category}
          className="flex aspect-[2/1] w-full items-center justify-center overflow-hidden rounded-xl"
        />
      </div>

      {category && (
        <span className="bg-accent-soft/40 text-accent inline-block w-fit rounded-full px-2.5 py-1 text-xs font-semibold">
          {category.name}
        </span>
      )}

      <h2 className="font-mv-mag-round text-foreground mt-4 text-2xl leading-9 group-hover:underline">
        {article.title}
      </h2>
      <p className="text-muted mt-3 line-clamp-2 text-sm leading-6">
        {article.excerpt}
      </p>

      <span className="text-muted/70 mt-5 text-xs">
        {article.publishedAt}
      </span>
    </Link>
  );
}
