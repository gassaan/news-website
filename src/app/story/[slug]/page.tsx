import { notFound } from "next/navigation";
import Link from "next/link";
import { stories } from "@/lib/articles";
import AuthorAvatar from "@/components/AuthorAvatar";
import EpisodeRatingLabel from "@/components/EpisodeRatingLabel";
import NewsIllustration from "@/components/NewsIllustration";
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
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col items-center text-center">
        <NewsIllustration
          category={story.category}
          className="mb-4 aspect-[3/4] w-40 overflow-hidden rounded-2xl"
        />
        <h1 className="font-mv-mag-round text-foreground text-2xl">
          {story.title}
        </h1>

        <div className="border-accent-soft/50 bg-card-accent/40 mt-4 flex items-center gap-3 rounded-full border p-1 pl-4">
          <AuthorAvatar name={story.author} className="h-9 w-9" />
          <span className="flex flex-col items-start text-right">
            <span className="text-foreground text-sm font-semibold">
              {story.author}
            </span>
            <span className="text-muted text-xs">ވާހަކަ ލިޔުންތެރިޔާ</span>
          </span>
        </div>

        <div className="mt-3">
          <StoryRatingBadge slug={story.slug} episodeCount={story.episodes.length} />
        </div>

        <p className="text-muted mt-3 text-sm leading-6">{story.excerpt}</p>
      </div>

      <div className="flex flex-col gap-2">
        {story.episodes.map((episode, index) => (
          <Link
            key={index}
            href={`/story/${slug}/${index + 1}`}
            className="border-accent-soft/40 hover:border-accent/60 flex items-center justify-between rounded-xl border px-4 py-3 transition-colors"
          >
            <span className="text-foreground font-semibold">
              {episode.title}
            </span>
            <span className="flex items-center gap-3">
              <EpisodeRatingLabel slug={slug} episode={index + 1} />
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted h-4 w-4"
              >
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
