export default function NewsTicker({ headlines }: { headlines: string[] }) {
  const track = [...headlines, ...headlines];

  return (
    <div className="bg-nav-bg overflow-hidden py-3">
      <div className="animate-marquee flex w-max whitespace-nowrap">
        {track.map((headline, index) => (
          <span
            key={index}
            className="text-nav-fg flex items-center gap-4 px-4 text-sm font-medium"
          >
            {headline}
            <span className="text-nav-fg/50" aria-hidden="true">
              •
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
