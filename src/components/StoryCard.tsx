import Link from "next/link";
import { Article } from "@/lib/articles";
import ArticleImage from "./ArticleImage";
import { getStoryPoster } from "@/lib/storyPosters";
import StoryPosterRating from "./StoryPosterRating";

export default function StoryCard({ article }: { article: Article }) {
  return (
    <Link href={`/story/${article.slug}`} className="story">
      <StoryPosterRating slug={article.slug} episodeCount={article.episodes?.length ?? 1} />
      <ArticleImage slug={article.slug} src={getStoryPoster(article.slug)} alt={article.title} />
    </Link>
  );
}
