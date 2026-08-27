import ArticleCard from "@/components/ArticleCard";
import HeroCarousel from "@/components/HeroCarousel";
import { articles, getFeaturedArticles } from "@/lib/articles";

export default function Home() {
  const featured = getFeaturedArticles();
  const heroArticles = featured.length > 0 ? featured : articles.slice(0, 3);
  const rest = articles.filter((a) => !heroArticles.includes(a));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <section className="mb-12">
        <HeroCarousel articles={heroArticles} />
      </section>

      <section>
        <h2 className="font-mv-mag-round text-foreground mb-4 text-xl">
          އެންމެ ފަހުގެ ޚަބަރު
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </section>
    </div>
  );
}
