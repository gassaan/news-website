"use client";

import { useRef, useState } from "react";
import ArticleImage from "./ArticleImage";
import Lightbox from "./Lightbox";

// Placeholder photos have no natural size, so vary tile shapes for a masonry look.
const MASONRY_RATIOS = ["4 / 5", "1 / 1", "3 / 4", "4 / 3", "1 / 1", "5 / 4"];

export default function AlbumViewer({
  photos,
  title,
  titles,
  tileRatio,
  viewerRatio,
}: {
  photos: string[];
  title: string;
  titles?: string[];
  tileRatio?: number;
  viewerRatio?: number;
}) {
  const [startIndex, setStartIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  function close() {
    setStartIndex(null);
    triggerRef.current?.focus();
  }

  return (
    <>
      <div className={tileRatio ? "photo-grid even" : "photo-grid"}>
        {photos.map((photo, i) => (
          <button
            key={photo}
            type="button"
            className="photo-tile"
            style={{ aspectRatio: tileRatio ?? MASONRY_RATIOS[i % MASONRY_RATIOS.length] }}
            aria-label={titles?.[i] ?? `ފޮޓޯ ${i + 1}`}
            onClick={(e) => {
              triggerRef.current = e.currentTarget;
              setStartIndex(i);
            }}
          >
            <ArticleImage slug={photo} alt="" />
          </button>
        ))}
      </div>

      {startIndex !== null && (
        <Lightbox
          photos={photos}
          title={title}
          titles={titles}
          startIndex={startIndex}
          ratio={viewerRatio}
          onClose={close}
        />
      )}
    </>
  );
}
