import { notFound } from "next/navigation";
import { articles, getArticle, getCategory } from "@/lib/articles";

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
      {category && (
        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-500">
          {category.name}
        </span>
      )}
      <h1 className="font-mv-mag-round mt-2 text-2xl leading-9 text-zinc-900 dark:text-zinc-50 sm:text-3xl">
        {article.title}
      </h1>
      <div className="mt-3 flex gap-3 text-sm text-zinc-500 dark:text-zinc-400">
        <span>{article.author}</span>
        <span>·</span>
        <span>{article.publishedAt}</span>
      </div>
      <div className="mt-6 flex flex-col gap-4 text-base leading-8 text-zinc-800 dark:text-zinc-200">
        {article.body.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
