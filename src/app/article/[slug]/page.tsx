import { notFound } from "next/navigation";
import {
  articles,
  formatDhivehiDate,
  getArticle,
  getCategory,
  pseudoViewCount,
} from "@/lib/articles";
import NewsIllustration from "@/components/NewsIllustration";
import ArticleBody from "@/components/ArticleBody";

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
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
        <h1 className="font-mv-mag-round text-foreground mt-6 text-3xl leading-tight sm:text-4xl">
          {article.title}
        </h1>
        <p className="text-muted mt-4 text-sm">
          {formatDhivehiDate(article.publishedAt)}
        </p>
      </header>

      <div className="relative left-1/2 right-1/2 -mx-[50vw] my-8 w-screen">
        <NewsIllustration
          category={article.category}
          className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden sm:aspect-[16/9]"
        />
      </div>

      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 text-sm sm:px-6">
        <span className="text-muted flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
            <circle cx="12" cy="12" r="2.5" />
          </svg>
          {pseudoViewCount(article.slug)}
        </span>
        <span className="text-muted flex items-center gap-1.5">
          {article.author}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
        </span>
      </div>

      <div className="border-accent-soft/40 mx-auto my-8 max-w-3xl border-t px-4 sm:px-6" />

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <ArticleBody paragraphs={article.body} />
      </div>
    </article>
  );
}
