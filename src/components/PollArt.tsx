// Picture for a poll without a photo: the Maldives atolls drawn as glowing dots.

// Rough atoll positions (latitude, longitude, size), north to south.
const ATOLLS: [number, number, number][] = [
  [6.95, 72.98, 0.12],
  [6.6, 72.92, 0.14],
  [6.3, 73.28, 0.14],
  [5.9, 73.4, 0.12],
  [5.6, 72.97, 0.13],
  [5.2, 73.05, 0.14],
  [5.35, 73.55, 0.1],
  [4.4, 73.5, 0.2],
  [3.95, 73.45, 0.14],
  [4.1, 72.87, 0.18],
  [3.65, 72.8, 0.14],
  [3.45, 73.5, 0.12],
  [3.2, 72.95, 0.1],
  [2.95, 73.55, 0.12],
  [2.85, 72.95, 0.1],
  [2.35, 73.2, 0.18],
  [1.9, 73.45, 0.12],
  [0.5, 73.25, 0.34],
  [-0.3, 73.43, 0.04],
  [-0.63, 73.15, 0.08],
];

const LON_MIN = 72.5;
const LAT_MAX = 7.3;
const SCALE = 100; // SVG units per degree

// Small repeatable random numbers, so each poll gets its own sparkle pattern.
function seeded(key: string) {
  let s = 0;
  for (const c of key) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export default function PollArt({ id }: { id: string }) {
  const rand = seeded(id);
  const dots: { x: number; y: number; r: number; glow: boolean; delay: number }[] = [];
  for (const [lat, lon, size] of ATOLLS) {
    const cx = (lon - LON_MIN) * SCALE;
    const cy = (LAT_MAX - lat) * SCALE;
    const ring = size * SCALE;
    const count = Math.max(4, Math.round(ring * 0.9));
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rand() * 0.4;
      const d = ring * (0.8 + rand() * 0.35);
      dots.push({
        x: cx + Math.cos(a) * d,
        y: cy + Math.sin(a) * d,
        r: 1.4 + rand() * 1.8,
        glow: rand() < 0.22,
        delay: rand() * 4,
      });
    }
  }

  // Upright on wide screens; on phones the chain lies sideways (north on the right) to fill the frame.
  const map = (horizontal: boolean) => (
    <svg
      className={horizontal ? "h" : "v"}
      viewBox={horizontal ? "-20 -40 860 260" : "-20 -20 180 850"}
      preserveAspectRatio="xMidYMid meet"
    >
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={(horizontal ? 820 - d.y : d.x).toFixed(1)}
          cy={(horizontal ? d.x : d.y).toFixed(1)}
          r={(d.r * (horizontal ? 1.6 : 1)).toFixed(1)}
          className={d.glow ? "glow" : undefined}
          style={d.glow ? { animationDelay: `${d.delay.toFixed(2)}s` } : undefined}
        />
      ))}
    </svg>
  );

  return (
    <div className="poll-img poll-art" aria-hidden="true">
      {map(false)}
      {map(true)}
      <span className="poll-art-tag">ރާއްޖެ ބުނަނީ ކީކޭ؟</span>
    </div>
  );
}
