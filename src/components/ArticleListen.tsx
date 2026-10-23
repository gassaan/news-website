"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

const BARS = 44;
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// Bar heights for the sound-wave strip: the same pattern every visit for one article.
function waveFor(seed: string): number[] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return Array.from({ length: BARS }, () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    return 6 + ((h >>> 0) % 19);
  });
}

// The article read aloud (recorded in the dashboard): a round play button on the edge
// of the main photo and a sound-wave strip under the headline that fills as it plays.
// Tap or drag along the strip to jump.
export default function ArticleListen({ src, title, image }: { src: string; title: string; image?: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [length, setLength] = useState(0);
  const bars = waveFor(src);
  const done = length ? time / length : 0;

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    const onTime = () => setTime(a.currentTime);
    const onMeta = () => Number.isFinite(a.duration) && setLength(a.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("durationchange", onMeta);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onPause);
    onMeta();
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("durationchange", onMeta);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onPause);
    };
  }, []);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (!a.paused) {
      a.pause();
      return;
    }
    // Title and photo on the phone's lock screen while it plays.
    if ("mediaSession" in navigator && typeof MediaMetadata !== "undefined")
      navigator.mediaSession.metadata = new MediaMetadata({ title, artist: "ހުޅަނގު", artwork: image ? [{ src: image }] : [] });
    a.play().catch(() => setPlaying(false));
  };

  const seekTo = (ratio: number) => {
    const a = audio.current;
    if (!a || !length) return;
    a.currentTime = Math.min(length, Math.max(0, ratio * length));
    setTime(a.currentTime);
  };
  // The strip fills from right to left, like the text is read.
  const seekAt = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    seekTo((box.right - e.clientX) / box.width);
  };
  const onKey = (e: KeyboardEvent) => {
    if (!length) return;
    const step = e.key === "ArrowLeft" ? 5 : e.key === "ArrowRight" ? -5 : 0;
    if (!step) return;
    e.preventDefault();
    seekTo((time + step) / length);
  };

  return (
    <>
      <audio ref={audio} src={src} preload="metadata" />
      <button type="button" className="listen-btn" aria-label={playing ? "ހުއްޓާ" : "ލިޔުން އަޑުއަހާ"} onClick={toggle}>
        {playing ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <div className="listen-wave">
        <div
          className="listen-bars"
          role="slider"
          tabIndex={0}
          aria-label="ލިޔުމުގެ އަޑު"
          aria-valuemin={0}
          aria-valuemax={Math.round(length)}
          aria-valuenow={Math.round(time)}
          aria-valuetext={`${clock(time)} / ${clock(length)}`}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            seekAt(e);
          }}
          onPointerMove={(e) => e.buttons && seekAt(e)}
          onKeyDown={onKey}
        >
          {bars.map((h, i) => (
            <span key={i} className={(i + 0.5) / BARS <= done ? "on" : undefined} style={{ height: h }} />
          ))}
        </div>
        <span className="listen-time num">
          {clock(time)} / {length ? clock(length) : "–:––"}
        </span>
      </div>
    </>
  );
}
