import Link from "next/link";
import { PhotoAlbum, albumPhotoSlug, formatDhivehiDate } from "@/lib/articles";
import ArticleImage from "./ArticleImage";
import PhotoCount from "./PhotoCount";

export default function AlbumCard({ album }: { album: PhotoAlbum }) {
  return (
    <Link href={`/gallery/${album.slug}`} className="card">
      <div className="album-media">
        <ArticleImage slug={albumPhotoSlug(album.slug, 0)} alt="" />
        <PhotoCount count={album.photoCount} />
      </div>
      <h3>{album.title}</h3>
      <div className="meta">{formatDhivehiDate(album.date)}</div>
    </Link>
  );
}
