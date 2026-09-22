import Link from "next/link";
import { Article, formatDhivehiDate } from "@/lib/articles";
import ArticleImage from "./ArticleImage";

export default function Card({ article }: { article: Article }) {
  return (
    <Link href={`/article/${article.slug}`} className="card">
      <ArticleImage slug={article.slug} alt="" />
      <h3>{article.title}</h3>
      <div className="meta">{formatDhivehiDate(article.publishedAt)}</div>
    </Link>
  );
}
