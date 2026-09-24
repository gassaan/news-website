import { notFound } from "next/navigation";
import Link from "next/link";
import { getAuthorSlug, stories } from "@/lib/articles";
import { getAuthorPhoto } from "@/lib/authorPhotos";
import { getStoryPoster, getStoryPosterStyle } from "@/lib/storyPosters";
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
    <>
      <header className="story-hero" style={getStoryPosterStyle(story.slug)}>
        <ArticleImage slug={story.slug} src={getStoryPoster(story.slug)} alt="" className="story-hero-img" />
        <div className="story-hero-text">
          <Link href="/stories" className="story-hero-chip">
            ވާހަކަ
          </Link>
          <h1>{story.title}</h1>
          <p className="story-hero-eps">
            <span className="num">{story.episodes.length}</span> ބައި
          </p>
          <div className="story-hero-meta">
            <Link href={`/author/${getAuthorSlug(story.author)}`} className="author">
              <ArticleImage
                slug={`author-${getAuthorSlug(story.author)}`}
                src={getAuthorPhoto(getAuthorSlug(story.author))}
                alt={story.author}
                className="avatar"
              />
              <span>{story.author}</span>
            </Link>
            <StoryRatingBadge slug={story.slug} episodeCount={story.episodes.length} />
          </div>
        </div>
      </header>
      <div className="story-blend" aria-hidden="true" />

      <div className="wrap story-page">
        <div className="mb-8 flex flex-col items-center text-center">
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
    </>
  );
}
