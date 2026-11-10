"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { pickAd, type Ad } from "@/lib/adPlaces";
import { remember } from "@/lib/api";
import { running, seen, send, url } from "./AdBox";

// The story's "next episode" button. With an advert set for "Between story episodes",
// tapping it first shows the advert full screen for 5 seconds (with a Skip button),
// then opens the next episode. At most once every 5 minutes, so readers going through
// several episodes aren't stopped every time.

const SECONDS = 5;
const GAP_MS = 5 * 60000;
const KEY = "hulhangu-story-ad";

export default function StoryBreakAd({ href, ads, episode, className, children }: { href: string; ads: Ad[]; episode: number; className: string; children: React.ReactNode }) {
  const router = useRouter();
  const [ad, setAd] = useState<Ad | null>(null);
  const [left, setLeft] = useState(SECONDS);
  const skip = useRef<HTMLButtonElement>(null);

  const go = () => {
    setAd(null);
    router.push(href);
  };

  // Count down, then carry on; the page behind doesn't scroll, Escape skips.
  useEffect(() => {
    if (!ad) return;
    seen(ad.id);
    skip.current?.focus();
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = "hidden";
    const tick = setInterval(() => setLeft((n) => n - 1), 1000);
    const done = setTimeout(go, SECONDS * 1000);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && go();
    document.addEventListener("keydown", esc);
    return () => {
      clearInterval(tick);
      clearTimeout(done);
      root.style.overflow = before;
      document.removeEventListener("keydown", esc);
    };
  }, [ad]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Link
        href={href}
        className={className}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          const last = Number(remember(KEY) ?? 0);
          if (Date.now() - last < GAP_MS) return;
          const pick = pickAd(running(ads, Date.now()), Math.random());
          if (!pick) return;
          e.preventDefault();
          remember(KEY, String(Date.now()));
          setLeft(SECONDS);
          setAd(pick);
        }}
      >
        {children}
      </Link>
      {ad &&
        createPortal(
          <div className="sb-ad" role="dialog" aria-modal="true" aria-label="އިޢުލާނު">
            <div className="sb-in">
              <div className="sb-top">
                <span>
                  ބައި {episode} ފެށެނީ <b>{Math.max(left, 1)}</b> ސިކުންތުން
                </span>
                <button ref={skip} type="button" className="sb-skip" onClick={go}>
                  ދޫކޮށްލާ ›
                </button>
              </div>
              <AdPictureLink ad={ad} />
              <small className="sb-sp">Sponsored</small>
              <span className="sb-bar" aria-hidden="true">
                <i style={{ animationDuration: `${SECONDS}s` }} />
              </span>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function AdPictureLink({ ad }: { ad: Ad }) {
  const pic = ad.square ?? ad.wide!;
  const img = (
    // eslint-disable-next-line @next/next/no-img-element -- the advert's own picture from the dashboard, never cropped
    <img src={url(pic, 1080)} srcSet={`${url(pic, 540)} 540w, ${url(pic, 1080)} 1080w`} sizes="(max-width: 600px) 92vw, 520px" width={pic.w} height={pic.h} alt={`އިޢުލާނު: ${ad.name}`} />
  );
  return ad.link ? (
    <a className="sb-pic" href={ad.link} target="_blank" rel="sponsored noopener noreferrer" onClick={() => send("tap", [ad.id])}>
      {img}
    </a>
  ) : (
    <div className="sb-pic">{img}</div>
  );
}
