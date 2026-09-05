const PALETTES: Record<string, { bg: string; shape: string; icon: string }> = {
  siyaasee: { bg: "#e8c257", shape: "#c9a13f", icon: "#2b2110" },
  viyafaari: { bg: "#4fb8a6", shape: "#3a8f81", icon: "#0f2a26" },
  kulhivaru: { bg: "#e8815f", shape: "#c8613f", icon: "#2e150a" },
  dhuniye: { bg: "#5ea3e0", shape: "#3f7fc0", icon: "#0d1f33" },
  life: { bg: "#e07bb0", shape: "#c25a90", icon: "#2e1220" },
  default: { bg: "#9b8ce0", shape: "#7a68c9", icon: "#1c1638" },
};

const PAGE_LINES = Array.from({ length: 10 });

export default function BookCoverIllustration({
  category,
  className = "flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-2xl",
}: {
  category: string;
  className?: string;
}) {
  const palette = PALETTES[category] ?? PALETTES.default;

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-[3%] left-0 flex w-[7%] flex-col justify-evenly rounded-l-sm bg-[#f4ecdb] px-px">
        {PAGE_LINES.map((_, i) => (
          <div key={i} className="h-px bg-black/10" />
        ))}
      </div>

      <div
        className="absolute inset-0 left-[6%] flex items-center justify-center rounded-r-2xl rounded-l-[3px]"
        style={{
          backgroundColor: palette.bg,
          boxShadow: "inset 3px 0 6px -2px rgba(0,0,0,0.35)",
        }}
      >
        <svg viewBox="0 0 200 150" className="h-3/4 w-3/4" aria-hidden="true">
          <circle cx="100" cy="75" r="52" fill={palette.shape} opacity="0.5" />
          <rect
            x="55"
            y="45"
            width="90"
            height="60"
            rx="10"
            fill={palette.icon}
            opacity="0.9"
          />
          <rect x="66" y="56" width="68" height="38" rx="4" fill={palette.bg} />
          <rect x="72" y="64" width="20" height="6" rx="3" fill={palette.icon} />
          <rect x="72" y="76" width="34" height="6" rx="3" fill={palette.icon} />
          <circle cx="100" cy="112" r="5" fill={palette.icon} />
          <circle cx="80" cy="118" r="3" fill={palette.icon} opacity="0.7" />
          <circle cx="120" cy="118" r="3" fill={palette.icon} opacity="0.7" />
        </svg>

        <div className="absolute inset-y-0 right-0 w-[10%] bg-gradient-to-l from-black/25 to-transparent" />
      </div>
    </div>
  );
}
