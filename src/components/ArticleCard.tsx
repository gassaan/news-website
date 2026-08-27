import Link from "next/link";
import { Article, getCategory } from "@/lib/articles";
import NewsIllustration from "./NewsIllustration";

export default function ArticleCard({ article }: { article: Article }) {
  const category = getCategory(article.category);

  return (
    <Link
      href={`/article/${article.slug}`}
      className="group border-accent-soft/40 hover:border-accent/60 flex flex-col gap-3 rounded-lg border p-4 transition-colors"
    >
      <NewsIllustration category={article.category} />
      {category && (
        <span className="text-accent text-xs font-semibold">
          {category.name}
        </span>
      )}
      <h2 className="font-mv-mag-round text-foreground text-lg leading-7 group-hover:underline">
        {article.title}
      </h2>
      <p className="text-muted line-clamp-2 text-sm leading-6">
        {article.excerpt}
      </p>
      <span className="text-muted/70 text-xs">{article.publishedAt}</span>
    </Link>
  );
}
