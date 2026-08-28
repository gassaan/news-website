import { notFound } from "next/navigation";
import CategoryArticleGrid from "@/components/CategoryArticleGrid";
import CategoryTabs from "@/components/CategoryTabs";
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
    <div className="bg-card-accent/70 relative left-1/2 right-1/2 -mx-[50vw] w-screen py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h1 className="font-mv-mag-round text-foreground mb-6 text-right text-2xl">
          ކެޓަގަރީތައް
        </h1>

        <CategoryTabs active={slug} />

        {categoryArticles.length === 0 ? (
          <p className="text-muted">މި ބައިގައި އަދި ޚަބަރެއް ނެތް</p>
        ) : (
          <CategoryArticleGrid articles={categoryArticles} />
        )}
      </div>
    </div>
  );
}
