import Link from "next/link";
import { Article } from "@/lib/articles";
import BookCoverIllustration from "./BookCoverIllustration";
import StoryPosterRating from "./StoryPosterRating";

export default function StoryCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/story/${article.slug}`}
      dir="rtl"
      className="group border-accent-soft/50 hover:border-accent/60 block rounded-2xl border p-3 transition-colors"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg">
        <BookCoverIllustration
          category={article.category}
          className="absolute inset-0 flex h-full w-full items-center justify-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        <StoryPosterRating
          slug={article.slug}
          episodeCount={article.episodes?.length ?? 1}
        />

        <h3 className="font-mv-mag-round absolute inset-x-3 bottom-3 line-clamp-2 text-base text-white group-hover:underline sm:text-lg">
          {article.title}
        </h3>
      </div>
    </Link>
  );
}
