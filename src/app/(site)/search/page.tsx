import { Suspense } from "react";
import SearchResults from "@/components/SearchResults";
import SkeletonCard from "@/components/SkeletonCard";
import {
  Article,
  articles,
  categories,
  reports,
  stories,
} from "@/lib/articles";

// Only what the result cards need; the article bodies stay out of the page.
function slim(a: Article): Article {
  return {
    ...a,
    body: [],
    episodes: a.episodes?.map((e) => ({ title: e.title, body: [] })),
  };
}

function categoryName(slug: string): string {
  return categories.find((c) => c.slug === slug)?.name ?? "";
}

// Shown until the search box and results are ready (they need the address's ?q=).
function SearchSkeleton() {
  return (
    <div className="wrap cat-page search-page" role="status" aria-label="ލޯޑުވަނީ">
      <div className="page-head">
        <span className="back" aria-hidden="true" />
        <h1 className="page-title">ހޯދުން</h1>
      </div>
      <span className="skel search-skel-box" />
      <div className="cat-grid">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  const news = [...articles, ...reports]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .map((a) => ({
      article: slim(a),
      text: `${a.title} ${a.excerpt} ${categoryName(a.category)}`,
    }));
  const tales = stories.map((s) => ({
    article: slim(s),
    text: `${s.title} ${s.excerpt} ${(s.episodes ?? []).map((e) => e.title).join(" ")}`,
  }));

  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchResults news={news} stories={tales} />
    </Suspense>
  );
}
