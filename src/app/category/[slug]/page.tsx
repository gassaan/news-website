import { notFound } from "next/navigation";
import Link from "next/link";
import Chips from "@/components/Chips";
import CardGrid from "@/components/CardGrid";
import AdSlot from "@/components/AdSlot";
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
    <>
      <div className="wrap cat-page">
        <div className="page-head">
          <Link className="back" href="/" aria-label="ފަހަތަށް">
            <svg width="14" height="26" viewBox="0 0 13 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 1l11 12L1 25" />
            </svg>
          </Link>
          <h1 className="page-title">{category.name}</h1>
        </div>

        <Chips categories={categories.filter((c) => c.slug !== "report")} active={slug} />

        {categoryArticles.length === 0 ? (
          <p className="text-muted mt-8">މި ބައިގައި އަދި ޚަބަރެއް ނެތް</p>
        ) : (
          <CardGrid articles={categoryArticles} />
        )}
      </div>
      <AdSlot />
    </>
  );
}
