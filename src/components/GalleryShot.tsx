import Link from "next/link";
import { PhotoAlbum, albumPhotoSlug, formatDhivehiDate } from "@/lib/articles";
import ArticleImage from "./ArticleImage";
import PhotoCount from "./PhotoCount";

export default function GalleryShot({ album }: { album: PhotoAlbum }) {
  return (
    <Link href={`/gallery/${album.slug}`} className="shot">
      <ArticleImage slug={albumPhotoSlug(album.slug, 0)} alt="" />
      <PhotoCount count={album.photoCount} />
      <span className="shot-cap">
        <strong>{album.title}</strong>
        <time dateTime={album.date}>{formatDhivehiDate(album.date)}</time>
      </span>
    </Link>
  );
}
