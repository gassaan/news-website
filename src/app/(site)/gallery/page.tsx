import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import GalleryShot from "@/components/GalleryShot";
import { getPhotoAlbums } from "@/lib/articles";

export default function GalleryPage() {
  const [featured, ...rest] = getPhotoAlbums();

  return (
    <>
      <div className="wrap gallery-page">
        <div className="page-head">
          <Link className="back" href="/" aria-label="ފަހަތަށް">
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
          <h1 className="page-title">ފޮޓޯ ގެލެރީ</h1>
        </div>

        <GalleryShot album={featured} featured />

        <div className="sec-head gallery-sec-head">
          <h2>ހުރިހާ ގެލެރީތައް</h2>
        </div>
        <div className="album-grid">
          {rest.map((album) => (
            <GalleryShot key={album.slug} album={album} />
          ))}
        </div>
      </div>
      <AdSlot />
    </>
  );
}
