"use client";

import { useEffect, useRef, useState } from "react";
import { API_URL, voterId } from "@/lib/api";
import { adStatus, pickAd, type Ad, type AdPicture } from "@/lib/adPlaces";

// One advert space: picks a running advert for this place (checking its dates in the
// reader's browser, so adverts start and end on time between site updates), counts
// that it was seen once it's half on screen, and counts taps. Without a running
// advert, it shows the space's own placeholder.

// Seen adverts are sent together, a moment after they appear, in one small request.
const queue = new Set<string>();
let timer: ReturnType<typeof setTimeout> | undefined;
export function send(event: "seen" | "tap", ads: string[]) {
  if (!API_URL || !ads.length) return;
  const body = JSON.stringify({ event, ads: ads.slice(0, 10), voter: voterId() });
  // A beacon still arrives when the tap opens another page.
  if (!navigator.sendBeacon?.(`${API_URL}/ad`, body)) {
    fetch(`${API_URL}/ad`, { method: "POST", body, keepalive: true }).catch(() => {});
  }
}
export function seen(id: string) {
  queue.add(id);
  clearTimeout(timer);
  timer = setTimeout(() => {
    send("seen", [...queue]);
    queue.clear();
  }, 1500);
}

export const running = (ads: Ad[], now: number) => ads.filter((a) => adStatus(a, now) === "running");
export const url = (p: AdPicture, w: number) => `${p.src}?w=${w}&auto=format&q=80`;

export default function AdBox({
  ads,
  first,
  square = false,
  sizes,
  placeholder,
  children,
}: {
  ads: Ad[];
  // The advert chosen when the site was built (shown until the page has loaded).
  first: string | null;
  // Inside articles: the square picture when the advert has one.
  square?: boolean;
  sizes: string;
  // The space without an advert.
  placeholder: React.ReactNode;
  // The "Sponsored" line under the space.
  children?: React.ReactNode;
}) {
  const [id, setId] = useState(first);
  const box = useRef<HTMLAnchorElement | HTMLDivElement | null>(null);

  // On the reader's clock: one of the adverts running now, the ones set to show more
  // often picked more often; none running shows the placeholder.
  useEffect(() => {
    const t = setTimeout(() => setId(pickAd(running(ads, Date.now()), Math.random())?.id ?? null), 0);
    return () => clearTimeout(t);
  }, [ads]);

  const ad = ads.find((a) => a.id === id) ?? null;

  useEffect(() => {
    const el = box.current;
    if (!ad || !el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          seen(ad.id);
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ad]);

  if (!ad) return <>{placeholder}{children}</>;
  const pic = (square && ad.square) || ad.wide || ad.square!;
  const img = (
    // eslint-disable-next-line @next/next/no-img-element -- the advert's own picture from the dashboard, never cropped
    <img
      className="ad-img"
      src={url(pic, 1456)}
      srcSet={`${url(pic, 728)} 728w, ${url(pic, 1456)} 1456w`}
      sizes={sizes}
      width={pic.w}
      height={pic.h}
      alt={`އިޢުލާނު: ${ad.name}`}
      loading="lazy"
      decoding="async"
    />
  );
  return (
    <>
      {ad.link ? (
        <a
          ref={(el) => {
            box.current = el;
          }}
          className="ad-link"
          href={ad.link}
          target="_blank"
          rel="sponsored noopener noreferrer"
          onClick={() => send("tap", [ad.id])}
        >
          {img}
        </a>
      ) : (
        <div
          ref={(el) => {
            box.current = el;
          }}
          className="ad-link"
        >
          {img}
        </div>
      )}
      {children}
    </>
  );
}
