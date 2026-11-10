import logoMask from "@/assets/hulhangu-logo-mask-web.png";

// The advertiser's report: one 1080 × 1350 picture (the shape that fits a phone screen
// and WhatsApp) with the advert, its dates, people who saw and tapped it, a chart of
// each day, and where it showed. Drawn in the browser, nothing is uploaded.

export type ReportData = {
  name: string;
  picture?: string; // the wide banner (Sanity's own resized copy)
  places: string[];
  seen: number;
  taps: number;
  days: { day: string; seen: number; taps: number }[];
};

const W = 1080;
const H = 1350;
const PAD = 72;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const parse = (d: string) => new Date(`${d}T00:00:00Z`);
const shift = (d: string, by: number) => new Date(parse(d).getTime() + by * 86400000).toISOString().slice(0, 10);

function load(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// "1 – 30 November 2026 · 30 days", or "28 October – 5 November 2026 · 9 days".
export function period(first: string, last: string) {
  const a = parse(first), b = parse(last);
  const days = Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
  const sameMonth = a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear();
  const from = sameMonth ? `${a.getUTCDate()}` : `${a.getUTCDate()} ${MONTHS[a.getUTCMonth()]}${a.getUTCFullYear() === b.getUTCFullYear() ? "" : ` ${a.getUTCFullYear()}`}`;
  return `${from} – ${b.getUTCDate()} ${MONTHS[b.getUTCMonth()]} ${b.getUTCFullYear()} · ${days} day${days === 1 ? "" : "s"}`;
}

export async function drawReport(data: ReportData): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const thaana = getComputedStyle(document.documentElement).getPropertyValue("--font-thaana").trim();
  const font = (weight: number, size: number) => `${weight} ${size}px Inter, ${thaana ? `${thaana}, ` : ""}-apple-system, "Segoe UI", sans-serif`;
  const text = (s: string, x: number, y: number, f: string, color: string, align: CanvasTextAlign = "left") => {
    ctx.font = f;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(s, x, y);
  };
  const fit = (s: string, max: number) => {
    if (ctx.measureText(s).width <= max) return s;
    let t = s;
    while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
    return `${t}…`;
  };
  const panel = (x: number, y: number, w: number, h: number, r: number, fill = "rgba(255,255,255,0.06)") => {
    round(ctx, x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    if (fill.startsWith("rgba")) {
      ctx.strokeStyle = "rgba(192,166,255,0.25)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  // Background: deep purple with a soft light at the top.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#2a1068");
  bg.addColorStop(0.55, "#150735");
  bg.addColorStop(1, "#0b0420");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.85, 0, 0, W * 0.85, 0, 620);
  glow.addColorStop(0, "rgba(110,60,220,0.75)");
  glow.addColorStop(1, "rgba(110,60,220,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Logo in white, and the title.
  const [logo, pic] = await Promise.all([load(logoMask.src), data.picture ? load(data.picture) : Promise.resolve(null)]);
  if (logo) {
    const lh = 90, lw = (logo.width / logo.height) * lh;
    const tint = document.createElement("canvas");
    tint.width = lw * 2;
    tint.height = lh * 2;
    const t = tint.getContext("2d")!;
    t.drawImage(logo, 0, 0, tint.width, tint.height);
    t.globalCompositeOperation = "source-in";
    t.fillStyle = "#ffffff";
    t.fillRect(0, 0, tint.width, tint.height);
    ctx.drawImage(tint, PAD, 70, lw, lh);
  }
  ctx.letterSpacing = "4px";
  text("ADVERT REPORT", W - PAD, 128, font(700, 22), "#c0a6ff", "right");
  ctx.letterSpacing = "0px";

  // The advert and its dates.
  const first = data.days[0]?.day;
  const last = data.days[data.days.length - 1]?.day;
  panel(PAD, 194, W - PAD * 2, 124, 34);
  let tx = PAD + 24;
  if (pic) {
    const pw = 260, ph = 65;
    ctx.save();
    round(ctx, tx, 194 + 30, pw, ph, 14);
    ctx.clip();
    const scale = Math.max(pw / pic.width, ph / pic.height);
    ctx.drawImage(pic, tx + (pw - pic.width * scale) / 2, 194 + 30 + (ph - pic.height * scale) / 2, pic.width * scale, pic.height * scale);
    ctx.restore();
    tx += pw + 28;
  }
  ctx.font = font(700, 40);
  text(fit(data.name || "Advert", W - PAD - 24 - tx), tx, 194 + 60, font(700, 40), "#fbf8ff");
  if (first && last) text(period(first, last), tx, 194 + 98, font(400, 24), "#c9b6f5");

  // The three numbers.
  const rate = data.seen ? (data.taps / data.seen) * 100 : 0;
  const nums = [
    { v: fmt(data.seen), l: "people saw it" },
    { v: fmt(data.taps), l: "people tapped it" },
    { v: `${rate < 10 ? rate.toFixed(1) : Math.round(rate)}%`, l: "tap rate" },
  ];
  const nw = (W - PAD * 2 - 40) / 3;
  nums.forEach((n, i) => {
    const x = PAD + i * (nw + 20);
    panel(x, 352, nw, 162, 30, i === 0 ? "#a882ff" : "rgba(255,255,255,0.06)");
    ctx.font = font(800, 66);
    text(fit(n.v, nw - 48), x + 24, 352 + 86, font(800, 66), i === 0 ? "#150735" : "#fbf8ff");
    text(n.l, x + 24, 352 + 128, font(400, 23), i === 0 ? "#2a1068" : "#c9b6f5");
  });

  // People who saw it each day (days without any are shown as empty bars).
  text("People who saw it each day", PAD, 584, font(600, 24), "#c9b6f5");
  const series: { day: string; seen: number }[] = [];
  if (first && last) {
    const byDay = new Map(data.days.map((d) => [d.day, d.seen]));
    for (let d = first; d <= last && series.length < 120; d = shift(d, 1)) series.push({ day: d, seen: byDay.get(d) ?? 0 });
  }
  const top = Math.max(1, ...series.map((d) => d.seen));
  const best = [...series].sort((a, b) => b.seen - a.seen).slice(0, 3).map((d) => d.day);
  const cw = W - PAD * 2, base = 790, ch = 180;
  const gap = series.length > 60 ? 2 : series.length > 30 ? 4 : 8;
  const bw = series.length ? (cw - gap * (series.length - 1)) / series.length : 0;
  series.forEach((d, i) => {
    const h = 6 + (d.seen / top) * (ch - 6);
    round(ctx, PAD + i * (bw + gap), base - h, bw, h, Math.min(6, bw / 2));
    ctx.fillStyle = best.includes(d.day) && d.seen ? "#a882ff" : "rgba(168,130,255,0.45)";
    ctx.fill();
  });
  const short = (d: string) => `${parse(d).getUTCDate()} ${MONTHS[parse(d).getUTCMonth()].slice(0, 3)}`;
  if (series.length) {
    text(short(series[0].day), PAD, base + 32, font(400, 19), "#9c88d6");
    if (series.length > 2) text(short(series[Math.floor(series.length / 2)].day), W / 2, base + 32, font(400, 19), "#9c88d6", "center");
    if (series.length > 1) text(short(series[series.length - 1].day), W - PAD, base + 32, font(400, 19), "#9c88d6", "right");
  }

  // Where it showed: one pill for each place.
  text("Where it showed", PAD, 900, font(600, 24), "#c9b6f5");
  let px = PAD, py = 922;
  ctx.font = font(600, 23);
  for (const p of data.places) {
    const w = ctx.measureText(p).width + 44;
    if (px + w > W - PAD) {
      px = PAD;
      py += 64;
    }
    round(ctx, px, py, w, 52, 26);
    ctx.fillStyle = "rgba(168,130,255,0.18)";
    ctx.fill();
    text(p, px + 22, py + 34, font(600, 23), "#fbf8ff");
    px += w + 12;
  }

  // Busiest day.
  const peak = series.find((d) => d.day === best[0]);
  if (peak && peak.seen) {
    const y = Math.max(py + 96, 1060);
    panel(PAD, y, W - PAD * 2, 104, 30);
    const d = parse(peak.day);
    const name = d.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
    text("Busiest day", PAD + 28, y + 44, font(400, 22), "#c9b6f5");
    text(`${name} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`, PAD + 28, y + 80, font(700, 28), "#fbf8ff");
    text(`${fmt(peak.seen)} people`, W - PAD - 28, y + 66, font(800, 34), "#a882ff", "right");
  }

  // Footer.
  ctx.fillStyle = "rgba(192,166,255,0.2)";
  ctx.fillRect(PAD, 1232, W - PAD * 2, 2);
  text("Each person is counted once a day", PAD, 1278, font(400, 21), "#9c88d6");
  text("Hulhangu", W - PAD, 1278, font(600, 21), "#9c88d6", "right");

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}
