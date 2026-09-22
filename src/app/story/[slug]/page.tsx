import { notFound } from "next/navigation";
import Link from "next/link";
import { getAuthorSlug, stories } from "@/lib/articles";
import ArticleImage from "@/components/ArticleImage";
import EpisodeRatingLabel from "@/components/EpisodeRatingLabel";
import StoryRatingBadge from "@/components/StoryRatingBadge";

export function generateStaticParams() {
  return stories.map((story) => ({ slug: story.slug }));
}

export default async function StoryEpisodeListPage({
  params,
}: PageProps<"/story/[slug]">) {
  const { slug } = await params;
  const story = stories.find((s) => s.slug === slug);

  if (!story || !story.episodes) {
    notFound();
  }

  return (
    <div className="wrap author-page">
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <ArticleImage slug={story.slug} alt={story.title} className="story-poster" />
        <h1 className="story-title">{story.title}</h1>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href={`/author/${getAuthorSlug(story.author)}`} className="author">
            <ArticleImage slug={`author-${getAuthorSlug(story.author)}`} alt={story.author} className="avatar" />
            <span>{story.author}</span>
          </Link>
          <StoryRatingBadge slug={story.slug} episodeCount={story.episodes.length} />
        </div>

        <p className="bio" style={{ margin: 0, maxWidth: "60ch" }}>
          {story.excerpt}
        </p>
      </div>

      <div className="episode-list">
        {story.episodes.map((episode, index) => (
          <Link key={index} href={`/story/${slug}/${index + 1}`} className="episode-row">
            <span>{episode.title}</span>
            <span className="ep-meta">
              <EpisodeRatingLabel slug={slug} episode={index + 1} />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
