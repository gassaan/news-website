"use client";

import { useEffect, useRef, useState } from "react";
import ArticleImage from "./ArticleImage";
import Lightbox from "./Lightbox";
import { cmsImage } from "@/lib/cmsImages";
import { GRAPHIC_RATIO, Graphic, formatDhivehiDate } from "@/lib/articles";

const MAX_ROTATE = 18;
const MAX_SCALE_DROP = 0.14;
const MAX_TRANSLATE_Z = 6;
const MAX_DIM = 0.55;
const NEW_FOR_MS = 2 * 24 * 60 * 60 * 1000;

// Full-size JPEG of a dashboard graphic, for saving and sharing.
function fullImage(slug: string): string | undefined {
  const src = cmsImage(slug)?.src;
  return src ? `${src.split("?")[0]}?w=1600&fm=jpg&q=90` : undefined;
}

export default function GraphicsCoverflow({ graphics }: { graphics: Graphic[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  // The current graphic as a file, fetched ahead so sharing stays inside the tap.
  const fileRef = useRef<{ slug: string; file: File } | null>(null);

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
      let nearest = 0;
      let nearestDist = Infinity;
      (Array.from(el.children) as HTMLElement[]).forEach((card, i) => {
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
        card.style.setProperty("--focus", String(Math.max(0, 1 - Math.abs(dist) * 2.5)));
        if (Math.abs(dist) < nearestDist) {
          nearestDist = Math.abs(dist);
          nearest = i;
        }
      });
      if (nearest !== activeRef.current) {
        activeRef.current = nearest;
        setActive(nearest);
      }
    }

    function onScroll() {
      if (frame == null) frame = requestAnimationFrame(update);
    }

    update();
    setNow(Date.now());
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame != null) cancelAnimationFrame(frame);
    };
  }, []);

  const current = graphics[active];
  const download = current ? fullImage(current.slug) : undefined;

  useEffect(() => {
    if (!current || !download || fileRef.current?.slug === current.slug) return;
    let cancelled = false;
    fetch(download)
      .then((res) => (res.ok ? res.blob() : Promise.reject()))
      .then((blob) => {
        if (cancelled) return;
        fileRef.current = {
          slug: current.slug,
          file: new File([blob], `hulhangu-${current.slug}.jpg`, { type: blob.type || "image/jpeg" }),
        };
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [current, download]);

  function goTo(i: number) {
    const card = trackRef.current?.children[i] as HTMLElement | undefined;
    const track = trackRef.current;
    if (!card || !track) return;
    const cardCenter = card.getBoundingClientRect().left + card.offsetWidth / 2;
    const trackCenter = track.getBoundingClientRect().left + track.clientWidth / 2;
    track.scrollBy({ left: cardCenter - trackCenter, behavior: "smooth" });
  }

  function open(i: number, trigger: HTMLElement) {
    triggerRef.current = trigger;
    setOpenIndex(i);
  }

  async function share() {
    if (!current) return;
    const url = `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/graphics/`;
    const file = fileRef.current?.slug === current.slug ? fileRef.current.file : undefined;
    if (navigator.share) {
      try {
        if (file && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: current.title });
        } else {
          await navigator.share({ title: current.title, url });
        }
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2000);
    } catch {
      window.prompt("ލިންކު:", url);
    }
  }

  return (
    <div className="coverflow-stage">
      <div className="coverflow" ref={trackRef}>
        {graphics.map((graphic, i) => (
          <button
            type="button"
            className="coverflow-item"
            key={graphic.slug}
            aria-label={graphic.title}
            onClick={(e) => (i === active ? open(i, e.currentTarget) : goTo(i))}
          >
            {now !== null && now - Date.parse(graphic.date) < NEW_FOR_MS && <span className="gfx-new">އާ</span>}
            <ArticleImage slug={graphic.slug} alt="" className="gfx" />
          </button>
        ))}
      </div>

      {current && (
        <div className="cf-cap" aria-live="polite">
          <p className="cf-title">{current.title}</p>
          <p className="cf-date">{formatDhivehiDate(current.date)}</p>
        </div>
      )}

      <div className="cf-dots">
        {graphics.map((graphic, i) => (
          <button
            type="button"
            key={graphic.slug}
            className={i === active ? "on" : undefined}
            aria-label={`${i + 1} / ${graphics.length}`}
            aria-current={i === active || undefined}
            onClick={() => goTo(i)}
          />
        ))}
      </div>

      <div className="cf-acts">
        <button type="button" className="round-btn" aria-label="ޝެއަރ ކުރައްވާ" onClick={share}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
          </svg>
        </button>
        {download && current && (
          <a className="round-btn" href={`${download}&dl=hulhangu-${current.slug}.jpg`} aria-label="ސޭވް ކުރައްވާ">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
            </svg>
          </a>
        )}
        <button type="button" className="round-btn" aria-label="ބޮޑުކޮށް ބައްލަވާ" onClick={(e) => open(active, e.currentTarget)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
      </div>
      <p className="toast" role="status" hidden={!toastVisible}>
        ލިންކު ކޮޕީ ކުރެވިއްޖެ
      </p>

      {openIndex !== null && (
        <Lightbox
          photos={graphics.map((g) => g.slug)}
          title="ގުރެފިކްސް"
          titles={graphics.map((g) => g.title)}
          startIndex={openIndex}
          ratio={GRAPHIC_RATIO}
          onClose={() => {
            setOpenIndex(null);
            triggerRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}
