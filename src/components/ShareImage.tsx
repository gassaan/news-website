"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cmsImage, fullImage } from "@/lib/cmsImages";
import { pseudoHue } from "@/lib/hue";
import logoMask from "@/assets/hulhangu-logo-mask.png";

// The picture: a dark card, the photo on one side and the headline with the
// news summary on the other, a big faint logo behind the text, and the date
// and website in small faint letters underneath. Sizes are for 1200 x 700,
// drawn twice as sharp.
const W = 1200;
const H = 700;
const SCALE = 2;
const CARD = { x: 30, y: 30, w: 1140, h: 640, r: 44, border: 2 };
const PHOTO_W = 545;
const TEXT = { right: 573, left: 72 };
const HEAD = { size: 64, line: 112, max: 2, color: "#ece6ff" };
const SUM = { size: 26, line: 60, max: 5, color: "#d9ccf7" };
const GAP = 30;
// Small faint line under the summary: the date on the right, the website on the left.
const FOOT = { size: 15, line: 22, gap: 18, color: "#d9ccf7", alpha: 0.35 };
const SITE = "hulhangu.com";
// Big faint logo, tilted, running off the card's bottom corner behind the text.
const MARK = { h: 260, x: -30, bottom: 720, rotate: -12, alpha: 0.06 };

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Fit words into at most `max` lines; the last line ends with "…" if text is left over.
function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  max: number,
  balance = false,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const fits = (s: string) => ctx.measureText(s).width <= width;
  const lines: string[] = [];
  let i = 0;
  while (i < words.length && lines.length < max) {
    let line = words[i++];
    while (i < words.length && fits(`${line} ${words[i]}`))
      line += ` ${words[i++]}`;
    lines.push(line);
  }
  if (i < words.length) {
    let last = lines[lines.length - 1];
    while (last.includes(" ") && !fits(`${last}…`))
      last = last.slice(0, last.lastIndexOf(" "));
    lines[lines.length - 1] = `${last}…`;
  } else if (balance && lines.length === 2) {
    // Two even lines read better than one long line and a short one.
    let best = lines;
    let bestWidth = Infinity;
    for (let k = 1; k < words.length; k++) {
      const a = words.slice(0, k).join(" ");
      const b = words.slice(k).join(" ");
      const w = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
      if (w <= width && w < bestWidth) {
        best = [a, b];
        bestWidth = w;
      }
    }
    return best;
  }
  return lines;
}

async function loadPhoto(slug: string): Promise<ImageBitmap | null> {
  const url = fullImage(slug);
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await createImageBitmap(await res.blob());
  } catch {
    return null;
  }
}

// The site logo in white, drawn from its mask image.
async function loadLogo(): Promise<HTMLCanvasElement | null> {
  try {
    const img = new Image();
    img.src = logoMask.src;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const g = c.getContext("2d");
    if (!g) return null;
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = "source-in";
    g.fillStyle = "#fff";
    g.fillRect(0, 0, c.width, c.height);
    return c;
  } catch {
    return null;
  }
}

async function drawPicture(
  slug: string,
  title: string,
  summary: string,
  date: string,
): Promise<Blob | null> {
  const headEl = document.querySelector("h1.headline");
  const bodyEl = document.querySelector(".art-body p") ?? document.body;
  const headFont = `900 ${HEAD.size}px ${headEl ? getComputedStyle(headEl).fontFamily : "sans-serif"}`;
  const bodyStyle = getComputedStyle(bodyEl);
  const sumFont = `${bodyStyle.fontWeight} ${SUM.size}px ${bodyStyle.fontFamily}`;
  const dateFont = `700 ${FOOT.size}px ${getComputedStyle(document.body).fontFamily}`;
  const siteFont = `500 ${FOOT.size}px ${getComputedStyle(document.body).getPropertyValue("--font-latin") || "sans-serif"}`;
  await Promise.all([
    document.fonts.load(headFont, title),
    document.fonts.load(sumFont, summary),
    document.fonts.load(dateFont, date),
    document.fonts.load(siteFont, SITE),
  ]).catch(() => {});
  const [photo, logo] = await Promise.all([loadPhoto(slug), loadLogo()]);

  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(SCALE, SCALE);

  // Page and card.
  ctx.fillStyle = "#080018";
  ctx.fillRect(0, 0, W, H);
  roundRect(ctx, CARD.x, CARD.y, CARD.w, CARD.h, CARD.r);
  ctx.fillStyle = "#270e61";
  ctx.fill();
  const inner = {
    x: CARD.x + CARD.border,
    y: CARD.y + CARD.border,
    w: CARD.w - CARD.border * 2,
    h: CARD.h - CARD.border * 2,
  };
  roundRect(ctx, inner.x, inner.y, inner.w, inner.h, CARD.r - CARD.border);
  ctx.fillStyle = "#150735";
  ctx.fill();

  // Faint logo behind the text, kept inside the card.
  if (logo) {
    const lw = (MARK.h * logo.width) / logo.height;
    ctx.save();
    roundRect(ctx, inner.x, inner.y, inner.w, inner.h, CARD.r - CARD.border);
    ctx.clip();
    ctx.globalAlpha = MARK.alpha;
    ctx.translate(MARK.x + lw / 2, MARK.bottom - MARK.h / 2);
    ctx.rotate((MARK.rotate * Math.PI) / 180);
    ctx.drawImage(logo, -lw / 2, -MARK.h / 2, lw, MARK.h);
    ctx.restore();
  }

  // Photo on the right, filling its side of the card.
  const px = inner.x + inner.w - PHOTO_W;
  ctx.save();
  roundRect(ctx, px, inner.y, PHOTO_W, inner.h, CARD.r - 4);
  ctx.clip();
  if (photo) {
    const [fx, fy] = (cmsImage(slug)?.pos ?? "50% 50%")
      .split(" ")
      .map((v) => (parseFloat(v) || 50) / 100);
    const scale = Math.max(PHOTO_W / photo.width, inner.h / photo.height);
    const dw = photo.width * scale;
    const dh = photo.height * scale;
    ctx.drawImage(
      photo,
      px - (dw - PHOTO_W) * fx,
      inner.y - (dh - inner.h) * fy,
      dw,
      dh,
    );
  } else {
    const hue = pseudoHue(slug);
    const g = ctx.createLinearGradient(
      px,
      inner.y,
      px + PHOTO_W,
      inner.y + inner.h,
    );
    g.addColorStop(0, `hsl(${hue} 60% 45%)`);
    g.addColorStop(1, `hsl(${hue + 40} 60% 25%)`);
    ctx.fillStyle = g;
    ctx.fillRect(px, inner.y, PHOTO_W, inner.h);
  }
  ctx.restore();

  // Headline and summary on the left, centred top to bottom.
  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const width = TEXT.right - TEXT.left;
  ctx.font = headFont;
  const headLines = wrap(ctx, title, width, HEAD.max, true);
  ctx.font = sumFont;
  const sumLines = summary ? wrap(ctx, summary, width, SUM.max) : [];
  const total =
    headLines.length * HEAD.line +
    (sumLines.length ? GAP + sumLines.length * SUM.line : 0) +
    FOOT.gap +
    FOOT.line;
  let y = inner.y + (inner.h - total) / 2;
  ctx.font = headFont;
  ctx.fillStyle = HEAD.color;
  for (const line of headLines) {
    ctx.fillText(line, TEXT.right, y + HEAD.line / 2);
    y += HEAD.line;
  }
  y += GAP;
  ctx.font = sumFont;
  ctx.fillStyle = SUM.color;
  for (const line of sumLines) {
    ctx.fillText(line, TEXT.right, y + SUM.line / 2);
    y += SUM.line;
  }
  y += FOOT.gap;
  ctx.globalAlpha = FOOT.alpha;
  ctx.fillStyle = FOOT.color;
  ctx.font = dateFont;
  ctx.fillText(date, TEXT.right, y + FOOT.line / 2);
  ctx.direction = "ltr";
  ctx.textAlign = "left";
  ctx.font = siteFont;
  ctx.fillText(SITE, TEXT.left, y + FOOT.line / 2);
  ctx.globalAlpha = 1;

  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
}

// Round button on the article page that turns the story into a picture to share or save.
export default function ShareImage({
  slug,
  title,
  summary,
  date,
}: {
  slug: string;
  title: string;
  summary: string;
  date: string;
}) {
  const [open, setOpen] = useState(false);
  const [picture, setPicture] = useState<{ file: File; url: string } | null>(
    null,
  );
  const [failed, setFailed] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  async function start() {
    setOpen(true);
    if (picture) return;
    setFailed(false);
    const blob = await drawPicture(slug, title, summary, date);
    if (!blob) {
      setFailed(true);
      return;
    }
    const file = new File([blob], `hulhangu-${slug}.jpg`, {
      type: "image/jpeg",
    });
    setPicture({ file, url: URL.createObjectURL(file) });
  }

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(
    () => () => {
      if (picture) URL.revokeObjectURL(picture.url);
    },
    [picture],
  );

  async function share() {
    if (!picture) return;
    if (navigator.canShare?.({ files: [picture.file] })) {
      try {
        await navigator.share({ files: [picture.file], title });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    // Phones that cannot share a picture save it instead.
    const a = document.createElement("a");
    a.href = picture.url;
    a.download = picture.file.name;
    a.click();
  }

  return (
    <>
      <button
        type="button"
        className="round-btn"
        ref={triggerRef}
        aria-label="ފޮޓޯއަކަށް ހަދާ"
        onClick={start}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="16" rx="4" />
          <circle cx="9" cy="10" r="2" />
          <path d="M4 18l5-5 4 4 3-3 4 4" />
        </svg>
      </button>

      {/* Drawn at the top of the page so it covers the header too. */}
      {open &&
        createPortal(
          <div className="si-back" onClick={close}>
            <div
              className="si-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="ފޮޓޯއަކަށް ހަދާ"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="si-close"
                ref={closeRef}
                aria-label="ބަންދުކުރޭ"
                onClick={close}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
              <div className="si-preview">
                {picture ? (
                  <img src={picture.url} alt={title} />
                ) : (
                  <span className="si-wait">
                    {failed ? "ފޮޓޯ ހެދުނުކަމެއް ނުވި" : "ހަދަނީ…"}
                  </span>
                )}
              </div>
              <div className="si-btns">
                <button
                  type="button"
                  className="si-go"
                  disabled={!picture}
                  onClick={share}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 15V3M7 8l5-5 5 5" />
                    <path d="M5 13v5a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-5" />
                  </svg>
                  ޝެއާ ކުރޭ
                </button>
                <a
                  className="si-save"
                  href={picture?.url}
                  download={picture?.file.name}
                  aria-disabled={!picture}
                  onClick={(e) => {
                    if (!picture) e.preventDefault();
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
                  </svg>
                  ސޭވް ކުރޭ
                </a>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
