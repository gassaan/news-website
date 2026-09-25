import { notFound } from "next/navigation";
import Link from "next/link";
import {
  articles,
  formatDhivehiDate,
  getArticle,
  getCategory,
  getPolls,
  getRelatedArticles,
  getSampleComments,
  pseudoTime,
  pseudoViewCount,
  reports,
} from "@/lib/articles";
import ArticleImage from "@/components/ArticleImage";
import ArticleBody from "@/components/ArticleBody";
import ArticleActions from "@/components/ArticleActions";
import PollCard from "@/components/PollCard";
import CommentSection from "@/components/CommentSection";
import SectionCarousel from "@/components/SectionCarousel";
import Card from "@/components/Card";
import AdSlot from "@/components/AdSlot";

export function generateStaticParams() {
  return [...articles, ...reports].map((article) => ({ slug: article.slug }));
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
  const polls = getPolls();
  const poll = polls[Math.abs(slug.length) % polls.length];
  const related = getRelatedArticles(article);

  return (
    <>
      <AdSlot className="art-top-ad" />

      <article className="story-page">
        <header className="wrap art-head">
          {category && (
            <Link className="cat-pill" href={`/category/${category.slug}`}>
              {category.name}
            </Link>
          )}
          <h1 className="headline">{article.title}</h1>
          <p className="dateline">
            {formatDhivehiDate(article.publishedAt)} <span aria-hidden="true">-</span>{" "}
            {article.time ?? pseudoTime(article.slug)}
          </p>
        </header>

        <figure className="lead">
          <ArticleImage slug={article.slug} alt={article.title} className="lead-img" />
          <figcaption>
            <span className="cap">
              <span>{article.excerpt}</span>
            </span>
            <span className="views">
              <span className="num">{pseudoViewCount(article.slug)}</span>
              <svg width="26" height="18" viewBox="0 0 26 18" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M1.5 9S5.5 1.5 13 1.5 24.5 9 24.5 9 20.5 16.5 13 16.5 1.5 9 1.5 9z" />
                <circle cx="13" cy="9" r="3.6" />
              </svg>
            </span>
          </figcaption>
        </figure>

        <div className="wrap">
          <ArticleBody slug={article.slug} paragraphs={article.body} author={article.author} />
          <ArticleActions title={article.title} />
        </div>
      </article>

      <AdSlot />

      <section className="wrap narrow">
        <PollCard poll={poll} />
      </section>

      <CommentSection initialComments={getSampleComments()} />

      {related.length > 0 && (
        <SectionCarousel id="related" title="ގުޅުންހުރި ލިޔުން">
          {related.map((a) => (
            <Card key={a.slug} article={a} />
          ))}
        </SectionCarousel>
      )}
    </>
  );
}
