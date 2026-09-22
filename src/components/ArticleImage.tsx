import { pseudoHue } from "@/lib/articles";

export default function ArticleImage({
  slug,
  src,
  alt = "",
  className = "",
}: {
  slug: string;
  src?: string;
  alt?: string;
  className?: string;
}) {
  const hue = pseudoHue(slug);

  return (
    <div className={`ph ${className}`} style={{ "--h": hue } as React.CSSProperties}>
      {src && <img src={src} alt={alt} />}
    </div>
  );
}
