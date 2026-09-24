import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import AlbumViewer from "@/components/AlbumViewer";
import { GRAPHIC_RATIO, getGraphics } from "@/lib/articles";

export default function GraphicsPage() {
  const graphics = getGraphics();

  return (
    <>
      <div className="wrap gallery-page">
        <div className="page-head">
          <Link className="back" href="/" aria-label="ފަހަތަށް">
            <svg width="14" height="26" viewBox="0 0 13 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 1l11 12L1 25" />
            </svg>
          </Link>
          <h1 className="page-title">ގުރެފިކްސް</h1>
        </div>

        <AlbumViewer
          photos={graphics.map((g) => g.slug)}
          title="ގުރެފިކްސް"
          titles={graphics.map((g) => g.title)}
          tileRatio={GRAPHIC_RATIO}
          viewerRatio={GRAPHIC_RATIO}
        />
      </div>
      <AdSlot />
    </>
  );
}
