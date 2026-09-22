import { GalleryShot as GalleryShotType, formatDhivehiDate } from "@/lib/articles";
import ArticleImage from "./ArticleImage";

export default function GalleryShot({ shot }: { shot: GalleryShotType }) {
  return (
    <figure className="shot">
      <ArticleImage slug={shot.slug} alt="" />
      <figcaption>
        <strong>{shot.title}</strong>
        <time>{formatDhivehiDate(shot.date)}</time>
      </figcaption>
    </figure>
  );
}
