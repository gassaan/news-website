import { notFound } from "next/navigation";
import Link from "next/link";
import CategoryArticleGrid from "@/components/CategoryArticleGrid";
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
        <div className="mb-6 flex items-center justify-end gap-2">
          <h1 className="font-mv-mag-round text-foreground text-2xl">
            ކެޓަގަރީތައް
          </h1>
          <Link
            href="/"
            aria-label="މައި ޞަފްޙާއަށް"
            className="text-foreground flex h-8 w-8 items-center justify-center"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
        </div>

        <div
          className="mb-6 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                c.slug === slug
                  ? "bg-background text-foreground border-accent-soft border"
                  : "text-muted hover:bg-background/40"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {categoryArticles.length === 0 ? (
          <p className="text-muted">މި ބައިގައި އަދި ޚަބަރެއް ނެތް</p>
        ) : (
          <CategoryArticleGrid articles={categoryArticles} />
        )}
      </div>
    </div>
  );
}
