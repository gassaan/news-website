import Link from "next/link";
import { PhotoAlbum, albumPhotoSlug } from "@/lib/articles";
import ArticleImage from "./ArticleImage";
import DateStamp from "./DateStamp";

// How many small round photos sit on the cover's bottom edge.
const THUMBS = 3;

// Album card in the news-card style: the cover photo, the next few photos as
// small circles on its edge with a "+N" for the rest, then the title and date.
// `featured` is the big card at the top of the gallery page.
export default function GalleryShot({
  album,
  featured = false,
}: {
  album: PhotoAlbum;
  featured?: boolean;
}) {
  const thumbs = Math.max(0, Math.min(THUMBS, album.photoCount - 1));
  const rest = album.photoCount - 1 - thumbs;

  return (
    <Link
      href={`/gallery/${album.slug}`}
      className={featured ? "card shot-card shot-feature" : "card shot-card"}
    >
      <ArticleImage slug={albumPhotoSlug(album.slug, 0)} alt="" />
      {thumbs > 0 && (
        <div className="shot-thumbs" aria-hidden="true">
          {Array.from({ length: thumbs }, (_, i) => (
            <ArticleImage
              key={i}
              slug={albumPhotoSlug(album.slug, i + 1)}
              alt=""
              className="shot-thumb"
            />
          ))}
          {rest > 0 && (
            <span className="shot-thumb shot-more num" dir="ltr">
              +{rest}
            </span>
          )}
        </div>
      )}
      {featured ? (
        <>
          <span className="album-new">އެންމެ ފަހުގެ ގެލެރީ</span>
          <h2>{album.title}</h2>
          <div className="shot-foot">
            <DateStamp date={album.date} />
          </div>
        </>
      ) : (
        <>
          <h3>{album.title}</h3>
          <DateStamp date={album.date} className="meta" />
        </>
      )}
    </Link>
  );
}
