import Link from "next/link";
import { Article, formatDhivehiDate } from "@/lib/articles";
import NewsIllustration from "./NewsIllustration";

export default function CategoryArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/article/${article.slug}`}
      className="group bg-background/80 border-accent-soft/30 hover:border-accent/50 flex flex-col rounded-3xl border p-3 transition-colors"
    >
      <NewsIllustration
        category={article.category}
        className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl"
      />
      <h3 className="font-mv-mag-round text-foreground mt-3 line-clamp-2 text-base leading-6 group-hover:underline">
        {article.title}
      </h3>
      <div className="border-accent-soft/40 mt-3 border-t pt-2">
        <span className="text-muted text-[10px] sm:text-xs">
          {formatDhivehiDate(article.publishedAt)}
        </span>
      </div>
    </Link>
  );
}
