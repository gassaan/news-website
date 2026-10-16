"use client";

// The main picture at the top of a page, loaded straight away. It lives in a
// browser-side component so the framework doesn't make every page that links
// here download it too while getting the link ready.
export default function EagerImg(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img {...props} />;
}
