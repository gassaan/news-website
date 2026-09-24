import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import AlbumCard from "@/components/AlbumCard";
import ArticleImage from "@/components/ArticleImage";
import PhotoCount from "@/components/PhotoCount";
import { albumPhotoSlug, formatDhivehiDate, getPhotoAlbums } from "@/lib/articles";

export default function GalleryPage() {
  const [featured, ...rest] = getPhotoAlbums();

  return (
    <>
      <div className="wrap gallery-page">
        <div className="page-head">
          <Link className="back" href="/" aria-label="ފަހަތަށް">
            <svg width="14" height="26" viewBox="0 0 13 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 1l11 12L1 25" />
            </svg>
          </Link>
          <h1 className="page-title">ފޮޓޯ ގެލެރީ</h1>
        </div>

        <Link href={`/gallery/${featured.slug}`} className="slide album-slide">
          <div className="copy">
            <span className="cat-pill">އެންމެ އާ ގެލެރީ</span>
            <h2>{featured.title}</h2>
            <p>
              {formatDhivehiDate(featured.date)} · {featured.photoCount} ފޮޓޯ
              <br />
              ފޮޓޯ: {featured.photographer}
            </p>
          </div>
          <div className="album-media">
            <ArticleImage slug={albumPhotoSlug(featured.slug, 0)} alt="" />
            <PhotoCount count={featured.photoCount} />
          </div>
        </Link>
      </div>

      <section className="wrap">
        <div className="sec-head">
          <h2>ހުރިހާ ގެލެރީތައް</h2>
        </div>
        <div className="cat-grid">
          {rest.map((album) => (
            <AlbumCard key={album.slug} album={album} />
          ))}
        </div>
      </section>

      <AdSlot />
    </>
  );
}
