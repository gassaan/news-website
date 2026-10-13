import type { Metadata } from "next";
import { cmsImage } from "./cmsImages";

// The site's public address, used for links that leave the site (Facebook, WhatsApp, ...).
export const SITE_URL = `https://gassaan.github.io${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`;

// A 1200 × 630 JPEG of a dashboard photo, cut around its chosen focus point:
// the size Facebook and WhatsApp show for a shared link.
function shareImage(key: string): string | undefined {
  const image = cmsImage(key);
  if (!image) return undefined;
  const [x, y] = (image.pos ?? "50% 50%").split(" ").map((v) => parseFloat(v) / 100);
  return `${image.src.split("?")[0]}?w=1200&h=630&fit=crop&crop=focalpoint&fp-x=${x}&fp-y=${y}&fm=jpg&q=85`;
}

// Title, summary and picture for a page's shared-link preview.
export function shareMetadata({
  title,
  description,
  path,
  imageKey,
  type = "article",
}: {
  title: string;
  description?: string;
  path: string;
  imageKey: string;
  type?: "article" | "website";
}): Metadata {
  const url = `${SITE_URL}${path}`;
  const image = shareImage(imageKey);
  const images = image ? [{ url: image, width: 1200, height: 630, alt: title }] : undefined;
  return {
    title: `${title} · Hulhangu`,
    description,
    alternates: { canonical: url },
    openGraph: { type, url, title, description, siteName: "Hulhangu", locale: "dv_MV", images },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined },
  };
}
