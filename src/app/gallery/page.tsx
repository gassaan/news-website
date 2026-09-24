import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import AlbumCard from "@/components/AlbumCard";
import ArticleImage from "@/components/ArticleImage";
import PhotoCount from "@/components/PhotoCount";
import { albumPhotoSlug, formatDhivehiDate, getPhotoAlbums } from "@/lib/articles";

const MOSAIC_TILES = 4;

export default function GalleryPage() {
  const [featured, ...rest] = getPhotoAlbums();
  const extra = featured.photoCount - MOSAIC_TILES;

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

        <Link href={`/gallery/${featured.slug}`} className="album-feature">
          <div className="album-mosaic">
            {Array.from({ length: MOSAIC_TILES }, (_, i) => (
              <div key={i} className="mosaic-tile">
                <ArticleImage slug={albumPhotoSlug(featured.slug, i)} alt="" />
                {i === MOSAIC_TILES - 1 && extra > 0 && (
                  <span className="album-more num" dir="ltr">
                    +{extra}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="album-feature-text">
            <span className="album-new">އެންމެ އާ ގެލެރީ</span>
            <h2>{featured.title}</h2>
            <p className="album-meta">
              <time dateTime={featured.date}>{formatDhivehiDate(featured.date)}</time>
              <PhotoCount count={featured.photoCount} className="photo-count-inline" />
              <span>ފޮޓޯ: {featured.photographer}</span>
            </p>
          </div>
        </Link>

        <div className="sec-head gallery-sec-head">
          <h2>ހުރިހާ ގެލެރީތައް</h2>
        </div>
        <div className="album-grid">
          {rest.map((album) => (
            <AlbumCard key={album.slug} album={album} />
          ))}
        </div>
      </div>
      <AdSlot />
    </>
  );
}
