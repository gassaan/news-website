import Link from "next/link";
import { Article, getCategory } from "@/lib/articles";
import NewsIllustration from "./NewsIllustration";

export default function CompactArticleCard({ article }: { article: Article }) {
  const category = getCategory(article.category);

  return (
    <Link
      href={`/article/${article.slug}`}
      className="group border-accent-soft/40 hover:border-accent/60 flex flex-col rounded-lg border p-3 transition-colors"
    >
      <NewsIllustration
        category={article.category}
        className="flex aspect-[2/1] w-full items-center justify-center overflow-hidden rounded-md"
      />
      {category && (
        <span className="text-accent mt-3 text-[10px] font-semibold sm:text-xs">
          {category.name}
        </span>
      )}
      <h3 className="font-mv-mag-round text-foreground mt-2 line-clamp-2 text-base leading-6 group-hover:underline sm:text-lg">
        {article.title}
      </h3>
    </Link>
  );
}
