import { notFound } from "next/navigation";
import { articles, getArticle, getCategory } from "@/lib/articles";
import NewsIllustration from "@/components/NewsIllustration";

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
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <NewsIllustration category={article.category} />
      </div>

      <header>
        {category && (
          <span className="bg-accent-soft/40 text-accent inline-block rounded-full px-3 py-1 text-xs font-semibold sm:text-sm">
            {category.name}
          </span>
        )}
        <h1 className="font-mv-mag-round text-foreground mt-4 text-3xl leading-tight sm:text-4xl">
          {article.title}
        </h1>
        <div className="text-muted mt-4 flex gap-3 text-sm">
          <span>{article.author}</span>
          <span aria-hidden="true">·</span>
          <span>{article.publishedAt}</span>
        </div>
      </header>

      <div className="border-accent-soft/40 my-8 border-t" />

      <div className="text-foreground/90 flex flex-col gap-6 text-base leading-8">
        {article.body.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
