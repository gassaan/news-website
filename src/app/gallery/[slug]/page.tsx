import { notFound } from "next/navigation";
import Link from "next/link";
import AlbumCard from "@/components/AlbumCard";
import AlbumViewer from "@/components/AlbumViewer";
import SectionCarousel from "@/components/SectionCarousel";
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

  const others = getPhotoAlbums().filter((a) => a.slug !== album.slug);

  return (
    <>
      <div className="wrap">
        <header className="art-head">
          <Link className="cat-pill" href="/gallery">
            ފޮޓޯ ގެލެރީ
          </Link>
          <h1 className="headline">{album.title}</h1>
          <p className="dateline">
            {formatDhivehiDate(album.date)} <span aria-hidden="true">-</span> {album.photoCount} ފޮޓޯ{" "}
            <span aria-hidden="true">-</span> ފޮޓޯ: {album.photographer}
          </p>
        </header>

        <div className="album-page">
          <AlbumViewer albumSlug={album.slug} title={album.title} count={album.photoCount} />
        </div>
      </div>

      <SectionCarousel id="related" title="އެހެން ގެލެރީތައް">
        {others.map((a) => (
          <AlbumCard key={a.slug} album={a} />
        ))}
      </SectionCarousel>
    </>
  );
}
