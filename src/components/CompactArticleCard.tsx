import Link from "next/link";
import { Article, formatDhivehiDate, getCategory } from "@/lib/articles";
import NewsIllustration from "./NewsIllustration";

export default function CompactArticleCard({ article }: { article: Article }) {
  const category = getCategory(article.category);

  return (
    <Link
      href={`/article/${article.slug}`}
      className="group border-accent-soft/40 hover:border-accent/60 flex flex-col rounded-2xl border p-3 transition-colors"
    >
      <NewsIllustration
        category={article.category}
        className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg"
      />
      {category && (
        <span className="text-accent mt-3 text-[10px] font-semibold sm:text-xs">
          {category.name}
        </span>
      )}
      <h3 className="font-mv-mag-round text-foreground mt-2 line-clamp-2 text-base leading-6 group-hover:underline sm:text-lg">
        {article.title}
      </h3>
      <div className="border-accent-soft/40 mt-3 border-t pt-2">
        <span className="text-accent text-xs">
          {formatDhivehiDate(article.publishedAt)}
        </span>
      </div>
    </Link>
  );
}
