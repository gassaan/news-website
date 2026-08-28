import { notFound } from "next/navigation";
import {
  articles,
  stories,
  formatDhivehiDate,
  getArticle,
  getCategory,
} from "@/lib/articles";
import NewsIllustration from "@/components/NewsIllustration";
import ArticleBody from "@/components/ArticleBody";

export function generateStaticParams() {
  return [...articles, ...stories].map((article) => ({ slug: article.slug }));
}

export default async function ArticlePage({
  params,
}: PageProps<"/article/[slug]">) {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) {
    notFound();
  }

  const category = getCategory(article.category);

  return (
    <article className="py-8">
      <header className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        {category && (
          <span className="bg-accent-soft/40 text-accent inline-block w-fit rounded-full px-4 py-1.5 text-sm font-semibold">
            {category.name}
          </span>
        )}
        <h1 className="font-mv-mag-round text-foreground mt-6 text-3xl leading-relaxed sm:text-4xl">
          {article.title}
        </h1>
        <p className="text-muted mt-4 text-sm">
          {formatDhivehiDate(article.publishedAt)}
        </p>
      </header>

      <div className="relative left-1/2 right-1/2 -mx-[50vw] mt-8 mb-3 w-screen">
        <NewsIllustration
          category={article.category}
          className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden sm:aspect-[16/9]"
        />
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <span className="bg-card-accent/50 text-muted inline-block w-fit rounded-full px-3 py-1.5 text-sm">
          ދިވެހި ޚަބަރު
        </span>
      </div>

      <div className="border-accent-soft/40 mx-auto my-4 max-w-3xl border-t px-4 sm:px-6" />

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <ArticleBody paragraphs={article.body} author={article.author} />
      </div>
    </article>
  );
}
