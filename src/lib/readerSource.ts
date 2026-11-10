// Where this reader came from, worked out in the browser (nothing about the reader is
// kept): Facebook, Instagram, X, a search engine, another Hulhangu page, another
// website, or "shared" when there's no sign (WhatsApp, Viber and typed-in links say nothing).
export type ReaderSource = "facebook" | "instagram" | "x" | "search" | "site" | "other" | "shared";

export function readerSource(): ReaderSource {
  const q = new URLSearchParams(location.search);
  const tag = (q.get("utm_source") ?? "").toLowerCase();
  const ua = navigator.userAgent;
  let host = "";
  try {
    host = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : "";
  } catch {}
  if (q.has("fbclid") || /facebook|^fb$/.test(tag) || /FBAN|FBAV|FB_IAB/.test(ua) || /(^|\.)(facebook\.com|fb\.com|fb\.me)$/.test(host)) return "facebook";
  if (/instagram/.test(tag) || /Instagram/.test(ua) || /(^|\.)instagram\.com$/.test(host)) return "instagram";
  if (/twitter|^x$/.test(tag) || /(^|\.)(x\.com|twitter\.com)$|^t\.co$/.test(host)) return "x";
  if (/(^|\.)google\.[a-z.]+$|(^|\.)(bing\.com|duckduckgo\.com|search\.yahoo\.com|yandex\.[a-z]+|ecosia\.org)$/.test(host)) return "search";
  if (host && host === location.hostname) return "site";
  if (host) return "other";
  return "shared";
}
