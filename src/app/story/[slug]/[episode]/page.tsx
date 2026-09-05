import { notFound } from "next/navigation";
import Link from "next/link";
import { stories } from "@/lib/articles";
import ArticleBody from "@/components/ArticleBody";
import EpisodeRatingWidget from "@/components/EpisodeRatingWidget";

export function generateStaticParams() {
  return stories.flatMap((story) =>
    (story.episodes ?? []).map((_, index) => ({
      slug: story.slug,
      episode: String(index + 1),
    })),
  );
}

export default async function StoryEpisodePage({
  params,
}: PageProps<"/story/[slug]/[episode]">) {
  const { slug, episode } = await params;
  const story = stories.find((s) => s.slug === slug);
  const episodeNumber = Number(episode);

  if (
    !story ||
    !story.episodes ||
    !Number.isInteger(episodeNumber) ||
    episodeNumber < 1 ||
    episodeNumber > story.episodes.length
  ) {
    notFound();
  }

  const currentEpisode = story.episodes[episodeNumber - 1];
  const totalEpisodes = story.episodes.length;
  const prevHref =
    episodeNumber > 1 ? `/story/${slug}/${episodeNumber - 1}` : null;
  const nextHref =
    episodeNumber < totalEpisodes ? `/story/${slug}/${episodeNumber + 1}` : null;

  return (
    <article className="py-8">
      <header className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <Link
          href={`/story/${slug}`}
          className="bg-accent-soft/40 text-accent hover:bg-accent-soft/60 inline-block rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
        >
          ވާހަކަ
        </Link>
        <h1 className="font-mv-mag-round text-foreground mt-6 text-3xl leading-relaxed sm:text-4xl">
          {story.title}
        </h1>
        <p className="text-muted mt-3 text-sm">
          {currentEpisode.title} — {episodeNumber}/{totalEpisodes}
        </p>
      </header>

      <div className="mx-auto mt-8 max-w-3xl px-4 sm:px-6">
        <ArticleBody paragraphs={currentEpisode.body} author={story.author} />
        <EpisodeRatingWidget slug={slug} episode={episodeNumber} />
      </div>

      <div className="mx-auto mt-8 flex max-w-3xl items-center justify-between px-4 sm:px-6">
        {prevHref ? (
          <Link
            href={prevHref}
            className="border-accent-soft/50 text-foreground hover:border-accent/60 rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
          >
            ކުރީގެ ބައި
          </Link>
        ) : (
          <span />
        )}

        {nextHref ? (
          <Link
            href={nextHref}
            className="bg-accent rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            ދެން އޮތް ބައި
          </Link>
        ) : (
          <span className="text-muted text-sm">ވާހަކަ ނިމިއްޖެ</span>
        )}
      </div>
    </article>
  );
}
