import Link from "next/link";
import { Article, formatDhivehiDate } from "@/lib/articles";
import ArticleImage from "./ArticleImage";

export default function Card({ article }: { article: Article }) {
  return (
    <Link href={`/article/${article.slug}`} className="card">
      <ArticleImage slug={article.slug} alt="" />
      <h3>{article.title}</h3>
      <CardDate date={article.publishedAt} />
    </Link>
  );
}

// Calendar-style date: the day large, the month and year stacked small beside it.
function CardDate({ date }: { date: string }) {
  const full = formatDhivehiDate(date);
  const [day, month, year] = full.split(" ");
  return (
    <div className="meta" aria-label={full}>
      <b className="num" aria-hidden="true">
        {day}
      </b>
      <i aria-hidden="true" />
      <span aria-hidden="true">
        <span>{month}</span>
        <span className="num">{year}</span>
      </span>
    </div>
  );
}
