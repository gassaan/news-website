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
    <article className="story-page">
      <header className="wrap art-head">
        <Link className="cat-pill" href={`/story/${slug}`}>
          ވާހަކަ
        </Link>
        <h1 className="headline">{story.title}</h1>
        <p className="dateline">
          {currentEpisode.title} <span aria-hidden="true">-</span> {episodeNumber}/{totalEpisodes}
        </p>
      </header>

      <div className="wrap">
        <ArticleBody slug={`${slug}-${episodeNumber}`} paragraphs={currentEpisode.body} author={story.author} />
        <EpisodeRatingWidget slug={slug} episode={episodeNumber} />

        <div className="mt-10 flex items-center justify-between">
          {prevHref ? (
            <Link href={prevHref} className="more">
              ކުރީގެ ބައި
            </Link>
          ) : (
            <span />
          )}

          {nextHref ? (
            <Link href={nextHref} className="btn-solid" style={{ alignSelf: "auto" }}>
              ދެން އޮތް ބައި
            </Link>
          ) : (
            <span className="text-muted text-sm">ވާހަކަ ނިމިއްޖެ</span>
          )}
        </div>
      </div>
    </article>
  );
}
