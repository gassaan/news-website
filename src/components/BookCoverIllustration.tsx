const PALETTES: Record<string, { bg: string; shape: string; icon: string }> = {
  siyaasee: { bg: "#e8c257", shape: "#c9a13f", icon: "#2b2110" },
  viyafaari: { bg: "#4fb8a6", shape: "#3a8f81", icon: "#0f2a26" },
  kulhivaru: { bg: "#e8815f", shape: "#c8613f", icon: "#2e150a" },
  dhuniye: { bg: "#5ea3e0", shape: "#3f7fc0", icon: "#0d1f33" },
  life: { bg: "#e07bb0", shape: "#c25a90", icon: "#2e1220" },
  default: { bg: "#9b8ce0", shape: "#7a68c9", icon: "#1c1638" },
};

const PAGE_LINES = Array.from({ length: 30 });
const DEPTH = 26;

export default function BookCoverIllustration({
  category,
  className = "aspect-[3/4] w-full",
}: {
  category: string;
  className?: string;
}) {
  const palette = PALETTES[category] ?? PALETTES.default;

  return (
    <div
      className={`relative ${className}`}
      style={{ perspective: "1000px" }}
    >
      {/* grounding shadow cast by the tilted book */}
      <div
        className="absolute inset-x-[4%] bottom-[-8%] h-[20%] rounded-full opacity-45 blur-lg"
        style={{ backgroundColor: palette.icon }}
      />

      <div
        className="absolute inset-0"
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateY(-32deg) rotateX(8deg)",
        }}
      >
        {/* top edge: a sliver of pages seen from above */}
        <div
          className="absolute inset-x-0 top-0 flex flex-row-reverse justify-evenly overflow-hidden bg-[#ede2c8]"
          style={{
            bottom: "100%",
            height: DEPTH,
            transformOrigin: "center bottom",
            transform: "rotateX(90deg)",
            boxShadow: "inset 0 -2px 4px rgba(0,0,0,0.15)",
          }}
        >
          {PAGE_LINES.slice(0, 14).map((_, i) => (
            <div key={i} className="my-[3px] w-px bg-black/10" />
          ))}
        </div>

        {/* fore-edge: the book's thickness, revealed on the left as it tilts */}
        <div
          className="absolute top-0 flex h-full flex-col justify-evenly overflow-hidden bg-[#f2e9d3] py-[6%]"
          style={{
            right: "100%",
            width: DEPTH,
            transformOrigin: "right center",
            transform: "rotateY(-90deg)",
            boxShadow: "inset -2px 0 4px rgba(0,0,0,0.15)",
          }}
        >
          {PAGE_LINES.map((_, i) => (
            <div key={i} className="mx-[3px] h-px bg-black/10" />
          ))}
        </div>

        {/* spine: the bound edge, receding on the right */}
        <div
          className="absolute top-0 h-full"
          style={{
            left: "100%",
            width: DEPTH,
            transformOrigin: "left center",
            transform: "rotateY(90deg)",
            backgroundColor: palette.shape,
            boxShadow: "inset 2px 0 6px rgba(0,0,0,0.35)",
          }}
        />

        {/* front cover */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[2px]"
          style={{
            backgroundColor: palette.bg,
            boxShadow: "0 22px 34px -14px rgba(0,0,0,0.6)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-l from-black/25 via-transparent to-white/20" />

          <svg viewBox="0 0 200 150" className="relative h-3/4 w-3/4" aria-hidden="true">
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
        </div>
      </div>
    </div>
  );
}
