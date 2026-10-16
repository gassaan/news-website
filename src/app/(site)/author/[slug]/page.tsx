import { notFound } from "next/navigation";
import ArticleImage from "@/components/ArticleImage";
import CardGrid from "@/components/CardGrid";
import GalleryShot from "@/components/GalleryShot";
import StoryCard from "@/components/StoryCard";
import AdSlot from "@/components/AdSlot";
import {
  authors,
  getAlbumsByPhotographer,
  getArticlesByAuthor,
  getAuthor,
  getStoriesByAuthor,
} from "@/lib/articles";
import { getAuthorPhoto } from "@/lib/authorPhotos";

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

  // Everything this person made: articles and reports, stories, photo albums.
  const authorArticles = getArticlesByAuthor(slug);
  const authorStories = getStoriesByAuthor(slug);
  const authorAlbums = getAlbumsByPhotographer(slug);
  const sections = [authorArticles, authorStories, authorAlbums].filter((list) => list.length > 0).length;
  const commentCount = 40 + authorArticles.length * 12;

  return (
    <>
      <div className="wrap author-page">
        <header className="profile">
          <div className="who">
            <ArticleImage slug={`author-${slug}`} src={getAuthorPhoto(slug)} alt={author.name} className="big-avatar" />
            <div>
              <h1>{author.name}</h1>
              <p>{author.role}</p>
            </div>
          </div>
          <div className="stats">
            {(authorArticles.length > 0 || sections === 0) && (
              <span className="stat">
                <svg width="18" height="20" viewBox="0 0 20 24" fill="currentColor">
                  <path d="M13.6 0H4.4A4.4 4.4 0 0 0 0 4.4v15.2A4.4 4.4 0 0 0 4.4 24h11.2a4.4 4.4 0 0 0 4.4-4.4V6.4zM5.6 17.2h8.8a.9.9 0 0 1 0 1.8H5.6a.9.9 0 0 1 0-1.8zm0-5h5.6a.9.9 0 0 1 0 1.8H5.6a.9.9 0 0 1 0-1.8zM13 1.8l5.2 5.4h-3.4A1.8 1.8 0 0 1 13 5.4z" />
                </svg>
                <span className="num">{authorArticles.length}</span> އާޓިކަލް
              </span>
            )}
            {authorStories.length > 0 && (
              <span className="stat">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 4.8A2.8 2.8 0 0 1 5.8 2H11v18.5a3.5 3.5 0 0 0-2.6-1.2H3zM21 4.8V19.3h-5.4a3.5 3.5 0 0 0-2.6 1.2V2h5.2A2.8 2.8 0 0 1 21 4.8z" />
                </svg>
                <span className="num">{authorStories.length}</span> ވާހަކަ
              </span>
            )}
            {authorAlbums.length > 0 && (
              <span className="stat">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 3h14a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zm3.5 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM4 17.5l5-5 3 3 4-4 4 4V6a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1z" />
                </svg>
                <span className="num">{authorAlbums.length}</span> ގެލެރީ
              </span>
            )}
            <span className="stat">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1.5A10.5 10.5 0 0 0 2.8 17.1L1.6 21.3a.9.9 0 0 0 1.1 1.1l4.2-1.2A10.5 10.5 0 1 0 12 1.5zM7.5 13.3a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6zm4.5 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6zm4.5 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6z" />
              </svg>
              <span className="num">{commentCount}</span> ކޮމެންޓް
            </span>
          </div>
        </header>

        <p className="bio">{author.bio}</p>

        {sections === 0 && <p className="text-muted mt-8">މި ލިޔުންތެރިޔާގެ ލިޔުމެއް އަދި ނެތް</p>}

        {authorArticles.length > 0 && (
          <section className="author-sec">
            {sections > 1 && (
              <div className="sec-head">
                <h2>ލިޔުންތައް</h2>
              </div>
            )}
            <CardGrid articles={authorArticles} />
          </section>
        )}

        {authorStories.length > 0 && (
          <section className="author-sec">
            {sections > 1 && (
              <div className="sec-head">
                <h2>ވާހަކަ</h2>
              </div>
            )}
            <div className="cat-grid story-grid">
              {authorStories.map((story) => (
                <StoryCard key={story.slug} article={story} />
              ))}
            </div>
          </section>
        )}

        {authorAlbums.length > 0 && (
          <section className="author-sec">
            {sections > 1 && (
              <div className="sec-head">
                <h2>ފޮޓޯ ގެލެރީ</h2>
              </div>
            )}
            <div className="album-grid">
              {authorAlbums.map((album) => (
                <GalleryShot key={album.slug} album={album} />
              ))}
            </div>
          </section>
        )}
      </div>
      <AdSlot />
    </>
  );
}
