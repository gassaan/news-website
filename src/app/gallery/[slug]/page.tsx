import { notFound } from "next/navigation";
import Link from "next/link";
import AlbumCard from "@/components/AlbumCard";
import AlbumViewer from "@/components/AlbumViewer";
import PhotoCount from "@/components/PhotoCount";
import { formatDhivehiDate, getPhotoAlbum, getPhotoAlbums } from "@/lib/articles";

export function generateStaticParams() {
  return getPhotoAlbums().map((album) => ({ slug: album.slug }));
}

export default async function AlbumPage({ params }: PageProps<"/gallery/[slug]">) {
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
          <svg width="14" height="26" viewBox="0 0 13 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 1l11 12L1 25" />
          </svg>
        </Link>
        <Link href="/gallery" className="album-crumb">
          ފޮޓޯ ގެލެރީ
        </Link>
      </div>

      <header className="album-head">
        <h1 className="headline">{album.title}</h1>
        <p className="album-meta">
          <time dateTime={album.date}>{formatDhivehiDate(album.date)}</time>
          <PhotoCount count={album.photoCount} className="photo-count-inline" />
          <span>ފޮޓޯ: {album.photographer}</span>
        </p>
      </header>

      <AlbumViewer albumSlug={album.slug} title={album.title} count={album.photoCount} />

      <section className="album-others">
        <div className="sec-head">
          <h2>އެހެން ގެލެރީތައް</h2>
          <Link className="more" href="/gallery">
            ހުރިހާ ގެލެރީ <span aria-hidden="true">›</span>
          </Link>
        </div>
        <div className="album-grid">
          {others.map((a) => (
            <AlbumCard key={a.slug} album={a} />
          ))}
        </div>
      </section>
    </div>
  );
}
