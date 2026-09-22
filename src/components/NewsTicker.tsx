export default function NewsTicker({ headlines }: { headlines: string[] }) {
  const track = [...headlines, ...headlines];

  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-row animate-ticker">
        {track.map((headline, index) => (
          <span key={index}>{headline}</span>
        ))}
      </div>
    </div>
  );
}
