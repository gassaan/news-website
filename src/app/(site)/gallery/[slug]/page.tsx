import { notFound } from "next/navigation";
import Link from "next/link";
import GalleryShot from "@/components/GalleryShot";
import AlbumViewer from "@/components/AlbumViewer";
import DateStamp from "@/components/DateStamp";
import ArticleImage from "@/components/ArticleImage";
import { getAuthorPhoto } from "@/lib/authorPhotos";
import {
  albumPhotoSlug,
  findAuthorSlug,
  getPhotoAlbum,
  getPhotoAlbums,
} from "@/lib/articles";

export function generateStaticParams() {
  return getPhotoAlbums().map((album) => ({ slug: album.slug }));
}

export default async function AlbumPage({
  params,
}: PageProps<"/gallery/[slug]">) {
  const { slug } = await params;
  const album = getPhotoAlbum(slug);

  if (!album) {
    notFound();
  }

  const photographerSlug = findAuthorSlug(album.photographer);
  const others = getPhotoAlbums()
    .filter((a) => a.slug !== album.slug)
    .slice(0, 4);

  return (
    <div className="wrap album-page">
      <div className="page-head">
        <Link className="back" href="/gallery" aria-label="ފަހަތަށް">
          <svg
            width="14"
            height="26"
            viewBox="0 0 13 26"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 1l11 12L1 25" />
          </svg>
        </Link>
        <Link href="/gallery" className="album-crumb">
          ފޮޓޯ ގެލެރީ
        </Link>
      </div>

      <header className="album-head">
        <h1 className="headline">{album.title}</h1>
        {/* The same author capsule as the article page; it links when the photographer has a page. */}
        {photographerSlug ? (
          <Link
            href={`/author/${photographerSlug}`}
            className="author album-author"
          >
            <ArticleImage
              slug={`author-${photographerSlug}`}
              src={getAuthorPhoto(photographerSlug)}
              alt={album.photographer}
              className="avatar"
            />
            <span>{album.photographer}</span>
          </Link>
        ) : (
          <span className="author album-author">
            <span className="avatar avatar-blank" aria-hidden="true">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              >
                <circle cx="12" cy="8.5" r="4" />
                <path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
              </svg>
            </span>
            <span>{album.photographer}</span>
          </span>
        )}
        <DateStamp className="art-date" date={album.date} />
      </header>

      {/* A small heading over the photos, with the photo count beside it. */}
      <div className="album-photos-head">
        <h2>ފޮޓޯތައް</h2>
        <span className="photo-count" aria-label={`${album.photoCount} ފޮޓޯ`}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="7" width="14" height="14" rx="3" />
            <path d="M7 3h11a3 3 0 0 1 3 3v11" />
            <path d="M3 17l4-4 4 4 2-2 4 4" />
          </svg>
          <b className="num" aria-hidden="true">
            {album.photoCount}
          </b>
          <span aria-hidden="true">ފޮޓޯ</span>
        </span>
      </div>

      <AlbumViewer
        photos={Array.from({ length: album.photoCount }, (_, i) =>
          albumPhotoSlug(album.slug, i),
        )}
        title={album.title}
      />

      <section className="album-others">
        <div className="sec-head">
          <h2>އެހެން ގެލެރީތައް</h2>
          <Link className="more" href="/gallery">
            ހުރިހާ ގެލެރީ <span aria-hidden="true">›</span>
          </Link>
        </div>
        <div className="album-grid">
          {others.map((a) => (
            <GalleryShot key={a.slug} album={a} />
          ))}
        </div>
      </section>
    </div>
  );
}
