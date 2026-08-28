import Link from "next/link";
import CategoryCarousel from "@/components/CategoryCarousel";
import CompactArticleCard from "@/components/CompactArticleCard";
import HeroCarousel from "@/components/HeroCarousel";
import NewsTicker from "@/components/NewsTicker";
import StoryCard from "@/components/StoryCard";
import { articles, getFeaturedArticles, stories } from "@/lib/articles";

export default function Home() {
  const featured = getFeaturedArticles();
  const heroArticles = featured.length > 0 ? featured : articles.slice(0, 3);
  const rest = articles
    .filter((a) => !heroArticles.includes(a))
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  const latest = rest.slice(0, 6);
  const tickerHeadlines = rest.slice(0, 4).map((a) => a.title);

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
        <section className="flex h-[36rem] flex-col">
          <HeroCarousel articles={heroArticles} />
        </section>
      </div>

      <NewsTicker headlines={tickerHeadlines} />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <section>
          <h2 className="font-mv-mag-round text-foreground mb-4 text-2xl">
            އެންމެ ފަހުގެ ޚަބަރު
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            {latest.map((article) => (
              <CompactArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </section>
      </div>

      <div className="py-8">
        <h2 className="font-mv-mag-round text-foreground mx-auto mb-4 max-w-5xl px-4 text-2xl sm:px-6">
          ކެޓަގަރީތައް
        </h2>
        <CategoryCarousel />
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-8 sm:px-6">
        <section>
          <h2 className="font-mv-mag-round text-foreground mb-4 text-2xl">
            ވާހަކަތައް
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            {stories.map((article) => (
              <StoryCard key={article.slug} article={article} />
            ))}
          </div>
          <div className="mt-5 flex justify-center">
            <Link
              href="/stories"
              className="bg-accent-soft/40 text-accent hover:bg-accent-soft/60 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
            >
              އިތުރު ވާހަކަ
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
