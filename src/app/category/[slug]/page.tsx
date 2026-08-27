import { notFound } from "next/navigation";
import ArticleCard from "@/components/ArticleCard";
import { categories, getArticlesByCategory, getCategory } from "@/lib/articles";

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export default async function CategoryPage({
  params,
}: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    notFound();
  }

  const categoryArticles = getArticlesByCategory(slug);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-mv-mag-round text-foreground mb-6 text-2xl">
        {category.name}
      </h1>
      {categoryArticles.length === 0 ? (
        <p className="text-muted">މި ބައިގައި އަދި ޚަބަރެއް ނެތް</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoryArticles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
