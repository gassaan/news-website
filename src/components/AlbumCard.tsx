import Link from "next/link";
import { PhotoAlbum, albumPhotoSlug, formatDhivehiDate } from "@/lib/articles";
import ArticleImage from "./ArticleImage";
import PhotoCount from "./PhotoCount";

export default function AlbumCard({ album }: { album: PhotoAlbum }) {
  return (
    <Link href={`/gallery/${album.slug}`} className="album-card">
      <div className="album-stack">
        <div className="album-cover">
          <ArticleImage slug={albumPhotoSlug(album.slug, 0)} alt="" />
          <PhotoCount count={album.photoCount} />
        </div>
      </div>
      <h3>{album.title}</h3>
      <time dateTime={album.date}>{formatDhivehiDate(album.date)}</time>
    </Link>
  );
}
