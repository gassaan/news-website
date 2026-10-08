import Link from "next/link";

// A strip of headlines moving across the screen. With a link, the whole strip opens that story.
export default function NewsTicker({
  headlines,
  className = "",
  href,
}: {
  headlines: string[];
  className?: string;
  href?: string;
}) {
  // Repeat short lists (like a single breaking headline) so the strip is always full.
  const times = Math.max(1, Math.ceil(6 / Math.max(1, headlines.length)));
  const half = Array.from({ length: times }, () => headlines).flat();
  const track = [...half, ...half];

  const row = (
    <div className="ticker-row animate-ticker" aria-hidden="true">
      {track.map((headline, index) => (
        <span key={index}>{headline}</span>
      ))}
    </div>
  );

  if (href) {
    return (
      <Link className={`ticker ${className}`} href={href} aria-label={headlines[0]}>
        {row}
      </Link>
    );
  }
  return <div className={`ticker ${className}`}>{row}</div>;
}
