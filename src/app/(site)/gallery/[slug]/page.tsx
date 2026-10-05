import { notFound } from "next/navigation";
import Link from "next/link";
import GalleryShot from "@/components/GalleryShot";
import AlbumViewer from "@/components/AlbumViewer";
import DateStamp from "@/components/DateStamp";
import { albumPhotoSlug, getPhotoAlbum, getPhotoAlbums } from "@/lib/articles";

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
        {/* Same calendar date as the article page, with the photo count beside it. */}
        <div className="album-meta">
          <DateStamp className="art-date" date={album.date} />
          <i className="album-meta-rule" aria-hidden="true" />
          <span className="album-count" aria-label={`${album.photoCount} ފޮޓޯ`}>
            <b className="num" aria-hidden="true">
              {album.photoCount}
            </b>
            <span aria-hidden="true">ފޮޓޯ</span>
          </span>
        </div>
        <p className="album-by">ފޮޓޯ: {album.photographer}</p>
      </header>

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
