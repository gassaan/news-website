"use client";

import { useEffect, useRef } from "react";
import ArticleImage from "./ArticleImage";
import { GalleryShot } from "@/lib/articles";

const MAX_ROTATE = 28;
const MAX_SCALE_DROP = 0.16;
const MAX_TRANSLATE_Z = 16;
const MAX_DIM = 0.5;

export default function GraphicsCoverflow({ shots }: { shots: GalleryShot[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame: number | null = null;

    function update() {
      frame = null;
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      for (const card of Array.from(el.children) as HTMLElement[]) {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const dist = Math.max(-1, Math.min(1, (cardCenter - center) / (rect.width / 2)));
        const rotate = dist * -MAX_ROTATE;
        const scale = 1 - Math.abs(dist) * MAX_SCALE_DROP;
        const translateZ = -Math.abs(dist) * MAX_TRANSLATE_Z;
        const dim = 1 - Math.abs(dist) * MAX_DIM;
        card.style.transform = `rotateY(${rotate}deg) scale(${scale}) translateZ(${translateZ}px)`;
        card.style.filter = `brightness(${dim})`;
        card.style.zIndex = String(Math.round((1 - Math.abs(dist)) * 100));
      }
    }

    function onScroll() {
      if (frame == null) frame = requestAnimationFrame(update);
    }

    update();
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame != null) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="coverflow-stage">
      <div className="coverflow" ref={trackRef}>
        {shots.map((shot) => (
          <div className="coverflow-item" key={shot.slug}>
            <ArticleImage slug={`gfx-${shot.slug}`} alt="" className="gfx" />
          </div>
        ))}
      </div>
    </div>
  );
}
