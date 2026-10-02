import Link from "next/link";
import { Article } from "@/lib/articles";
import ArticleImage from "./ArticleImage";
import DateStamp from "./DateStamp";

export default function Card({ article }: { article: Article }) {
  return (
    <Link href={`/article/${article.slug}`} className="card">
      <ArticleImage slug={article.slug} alt="" />
      <h3>{article.title}</h3>
      <DateStamp date={article.publishedAt} className="meta" />
    </Link>
  );
}
