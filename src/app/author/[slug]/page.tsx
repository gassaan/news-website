import { notFound } from "next/navigation";
import ArticleImage from "@/components/ArticleImage";
import CardGrid from "@/components/CardGrid";
import AdSlot from "@/components/AdSlot";
import { authors, getArticlesByAuthor, getAuthor } from "@/lib/articles";

export function generateStaticParams() {
  return authors.map((author) => ({ slug: author.slug }));
}

export default async function AuthorPage({
  params,
}: PageProps<"/author/[slug]">) {
  const { slug } = await params;
  const author = getAuthor(slug);

  if (!author) {
    notFound();
  }

  const authorArticles = getArticlesByAuthor(slug);
  const commentCount = 40 + authorArticles.length * 12;

  return (
    <>
      <div className="wrap author-page">
        <header className="profile">
          <div className="who">
            <ArticleImage slug={`author-${slug}`} alt={author.name} className="big-avatar" />
            <div>
              <h1>{author.name}</h1>
              <p>{author.role}</p>
            </div>
          </div>
          <div className="stats">
            <span className="stat">
              <svg width="18" height="20" viewBox="0 0 20 24" fill="currentColor">
                <path d="M13.6 0H4.4A4.4 4.4 0 0 0 0 4.4v15.2A4.4 4.4 0 0 0 4.4 24h11.2a4.4 4.4 0 0 0 4.4-4.4V6.4zM5.6 17.2h8.8a.9.9 0 0 1 0 1.8H5.6a.9.9 0 0 1 0-1.8zm0-5h5.6a.9.9 0 0 1 0 1.8H5.6a.9.9 0 0 1 0-1.8zM13 1.8l5.2 5.4h-3.4A1.8 1.8 0 0 1 13 5.4z" />
              </svg>
              <span className="num">{authorArticles.length}</span> އާޓިކަލް
            </span>
            <span className="stat">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1.5A10.5 10.5 0 0 0 2.8 17.1L1.6 21.3a.9.9 0 0 0 1.1 1.1l4.2-1.2A10.5 10.5 0 1 0 12 1.5zM7.5 13.3a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6zm4.5 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6zm4.5 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6z" />
              </svg>
              <span className="num">{commentCount}</span> ކޮމެންޓް
            </span>
          </div>
        </header>

        <p className="bio">{author.bio}</p>

        {authorArticles.length === 0 ? (
          <p className="text-muted mt-8">މި ލިޔުންތެރިޔާގެ ލިޔުމެއް އަދި ނެތް</p>
        ) : (
          <CardGrid articles={authorArticles} />
        )}
      </div>
      <AdSlot />
    </>
  );
}
