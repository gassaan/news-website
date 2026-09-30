import { notFound } from "next/navigation";
import Link from "next/link";
import { stories } from "@/lib/articles";
import ArticleBody from "@/components/ArticleBody";
import EpisodeRatingWidget from "@/components/EpisodeRatingWidget";
import { getEpisodePhoto } from "@/lib/storyPosters";

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
  const cover = getEpisodePhoto(slug, episodeNumber);

  return (
    <article className="story-page">
      {/* The episode's photo (or the story poster) fills the top and fades into the page behind the title. */}
      <header className="ep-head" style={cover.style}>
        {cover.src && (
          <div className="ep-cover" aria-hidden="true">
            <img src={cover.src} alt="" />
          </div>
        )}
        <div className="wrap art-head">
          <Link className="cat-pill" href={`/story/${slug}`}>
            ވާހަކަ
          </Link>
          <h1 className="headline">{story.title}</h1>
          <p className="dateline">
            {currentEpisode.title} <span aria-hidden="true">-</span> {episodeNumber}/{totalEpisodes}
          </p>
        </div>
      </header>

      <div className="wrap">
        <ArticleBody slug={`${slug}-${episodeNumber}`} paragraphs={currentEpisode.body} author={story.author} />
        <EpisodeRatingWidget slug={slug} episode={episodeNumber} />

        {/* Full-width buttons, easy to reach with a thumb: next on top, previous below. */}
        <nav className="ep-nav" aria-label="ބައިތައް">
          {nextHref ? (
            <Link href={nextHref} className="ep-btn solid">
              ދެން އޮތް ބައި ކިޔާލާ
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M11 6l-6 6 6 6" />
              </svg>
            </Link>
          ) : (
            <p className="ep-end">ވާހަކަ ނިމިއްޖެ</p>
          )}
          {prevHref && (
            <Link href={prevHref} className="ep-btn ghost">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
              ކުރީގެ ބައި
            </Link>
          )}
        </nav>
      </div>
    </article>
  );
}
