import { pseudoHue } from "@/lib/hue";
import { cmsImage } from "@/lib/cmsImages";
import EagerImg from "./EagerImg";

// Widths the dashboard's image service makes on request, so each phone or
// computer downloads a picture no bigger than the slot it fills.
const WIDTHS = [160, 320, 480, 640, 960, 1280, 1600];

// How wide some slots are on screen, by their class.
const CLASS_SIZES: Record<string, string> = {
  avatar: "64px",
  "big-avatar": "150px",
  "shot-thumb": "72px",
  "poll-img": "(max-width: 720px) 82vw, 460px",
  gfx: "(max-width: 720px) 80vw, 400px",
};

function srcSet(src: string): string | undefined {
  const max = Number(/[?&]w=(\d+)/.exec(src)?.[1]);
  if (!src.includes("cdn.sanity.io") || !max) return undefined;
  return [...WIDTHS.filter((w) => w < max), max]
    .map((w) => `${src.replace(/([?&])w=\d+/, `$1w=${w}`)} ${w}w`)
    .join(", ");
}

export default function ArticleImage({
  slug,
  src,
  alt = "",
  className = "",
  sizes,
  priority = false,
}: {
  slug: string;
  src?: string;
  alt?: string;
  className?: string;
  // How wide the slot is on screen; full screen width when not given.
  sizes?: string;
  // The main picture at the top of the page: fetched straight away instead of
  // waiting until the page is laid out.
  priority?: boolean;
}) {
  const hue = pseudoHue(slug);
  // A photo from the dashboard fills the slot when no image was passed in.
  const fromCms = src ? undefined : cmsImage(slug);
  const imageSrc = src ?? fromCms?.src;
  const set = imageSrc ? srcSet(imageSrc) : undefined;
  const slotSizes = sizes ?? className.split(/\s+/).map((c) => CLASS_SIZES[c]).find(Boolean) ?? "100vw";

  return (
    <div className={`ph ${className}`} style={{ "--h": hue } as React.CSSProperties}>
      {imageSrc && (
        // Order matters when the browser builds the picture: lazy, then the slot
        // width, then the sizes, then the address. Any other order can start a
        // second, full-width download.
        priority ? (
          <EagerImg
            loading="eager"
            decoding="async"
            sizes={set ? slotSizes : undefined}
            srcSet={set}
            src={imageSrc}
            alt={alt}
            style={fromCms?.pos ? { objectPosition: fromCms.pos } : undefined}
          />
        ) : (
          <img
            loading="lazy"
            decoding="async"
            sizes={set ? slotSizes : undefined}
            srcSet={set}
            src={imageSrc}
            alt={alt}
            style={fromCms?.pos ? { objectPosition: fromCms.pos } : undefined}
          />
        )
      )}
    </div>
  );
}
