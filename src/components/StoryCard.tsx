import Link from "next/link";
import { Article, pseudoRating } from "@/lib/articles";
import NewsIllustration from "./NewsIllustration";

export default function StoryCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/article/${article.slug}`}
      dir="rtl"
      className="group border-accent-soft/50 hover:border-accent/60 relative block aspect-[3/4] w-full overflow-hidden rounded-2xl border transition-colors"
    >
      <NewsIllustration
        category={article.category}
        className="absolute inset-0 flex h-full w-full items-center justify-center"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      <span className="bg-background/90 text-foreground absolute top-3 right-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold">
        <svg viewBox="0 0 24 24" fill="#eab308" className="h-3.5 w-3.5">
          <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.6l-5.9 3 1.3-6.6-4.9-4.6 6.6-.8Z" />
        </svg>
        {pseudoRating(article.slug)}
      </span>

      <h3 className="absolute inset-x-3 bottom-3 line-clamp-2 text-base font-bold text-white group-hover:underline sm:text-lg">
        {article.title}
      </h3>
    </Link>
  );
}
