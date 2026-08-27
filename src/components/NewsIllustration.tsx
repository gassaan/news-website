const PALETTES: Record<string, { bg: string; shape: string; icon: string }> = {
  siyaasee: { bg: "#e8c257", shape: "#c9a13f", icon: "#2b2110" },
  viyafaari: { bg: "#4fb8a6", shape: "#3a8f81", icon: "#0f2a26" },
  kulhivaru: { bg: "#e8815f", shape: "#c8613f", icon: "#2e150a" },
  dhuniye: { bg: "#5ea3e0", shape: "#3f7fc0", icon: "#0d1f33" },
  life: { bg: "#e07bb0", shape: "#c25a90", icon: "#2e1220" },
  default: { bg: "#9b8ce0", shape: "#7a68c9", icon: "#1c1638" },
};

export default function NewsIllustration({
  category,
  className = "flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl sm:aspect-[16/9]",
}: {
  category: string;
  className?: string;
}) {
  const palette = PALETTES[category] ?? PALETTES.default;

  return (
    <div className={className} style={{ backgroundColor: palette.bg }}>
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
    </div>
  );
}
