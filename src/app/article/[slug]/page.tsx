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
        <span className="text-accent text-sm font-semibold">
          {category.name}
        </span>
      )}
      <h1 className="font-mv-mag-round text-foreground mt-2 text-2xl leading-9 sm:text-3xl">
        {article.title}
      </h1>
      <div className="text-muted mt-3 flex gap-3 text-sm">
        <span>{article.author}</span>
        <span>·</span>
        <span>{article.publishedAt}</span>
      </div>
      <div className="text-foreground/90 mt-6 flex flex-col gap-4 text-base leading-8">
        {article.body.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
