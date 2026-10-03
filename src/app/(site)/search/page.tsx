import { Suspense } from "react";
import SearchResults from "@/components/SearchResults";
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
    <Suspense>
      <SearchResults news={news} stories={tales} />
    </Suspense>
  );
}
