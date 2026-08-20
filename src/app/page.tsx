import ArticleCard from "@/components/ArticleCard";
import { articles, getFeaturedArticles } from "@/lib/articles";

export default function Home() {
  const featured = getFeaturedArticles();
  const rest = articles.filter((a) => !a.featured);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {featured.length > 0 && (
        <section className="mb-10">
          <h1 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
            މުހިންމު ޚަބަރުތައް
          </h1>
          <div className="grid gap-4 sm:grid-cols-2">
            {featured.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
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
