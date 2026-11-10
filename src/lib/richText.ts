// Article and episode text from the dashboard, one block per line, with a few marks:
//   ## Sub-heading
//   > Quote            (lines in a row make one quote)
//   - List item        (or "1. " for a numbered list)
//   :: Fact box line   (lines in a row make one box)
//   ![Caption](photo link)
//   @[video](YouTube or Facebook link)
//   @[post](X, Facebook or Instagram post link)
//   ---                (a dividing line)
// Inside a line: **bold** and [words](link). Any other line is a plain paragraph, so
// text written before the editor had formatting still shows as it always did.
// A line that starts with "\" is a plain paragraph even if it looks like a mark.

export type Inline = { text: string; bold?: boolean; href?: string };

export type Block =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "quote"; lines: string[] }
  | { type: "box"; lines: string[] }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "img"; src: string; caption: string }
  | { type: "video"; url: string }
  | { type: "post"; url: string }
  | { type: "hr" }
  | ({ type: "table" } & TableData)
  | ({ type: "chart" } & ChartData);

// A table or chart inside the article, saved as one line: @[table]{…} or @[chart]{…}
// (the data as JSON, made in the newsroom's Table and Chart sheets).
export type TableData = { title: string; rows: string[][]; source: string };
export type ChartKind = "bar" | "col" | "pie";
export type ChartData = { kind: ChartKind; title: string; items: { label: string; value: number }[]; source: string };

const TABLE = /^@\[table\](\{.*\})$/;
const CHART = /^@\[chart\](\{.*\})$/;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

export function cleanTable(raw: unknown): TableData | null {
  const d = (raw ?? {}) as Partial<Record<keyof TableData, unknown>>;
  const rows = (Array.isArray(d.rows) ? d.rows : [])
    .slice(0, 40)
    .map((r) => (Array.isArray(r) ? r.slice(0, 8).map((c) => str(c, 120)) : []))
    .filter((r) => r.some(Boolean));
  if (!rows.length) return null;
  const cols = Math.max(...rows.map((r) => r.length));
  return { title: str(d.title, 160), rows: rows.map((r) => [...r, ...Array(cols - r.length).fill("")]), source: str(d.source, 160) };
}

export function cleanChart(raw: unknown): ChartData | null {
  const d = (raw ?? {}) as Partial<Record<keyof ChartData, unknown>>;
  const kind: ChartKind = d.kind === "col" || d.kind === "pie" ? d.kind : "bar";
  const items = (Array.isArray(d.items) ? d.items : [])
    .slice(0, 12)
    .map((i) => ({ label: str((i as { label?: unknown })?.label, 60), value: Number((i as { value?: unknown })?.value) }))
    .filter((i) => i.label && Number.isFinite(i.value) && i.value >= 0);
  if (!items.length) return null;
  return { kind, title: str(d.title, 160), items, source: str(d.source, 160) };
}

const json = (text: string) => {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
};
export const tableLine = (t: TableData) => `@[table]${JSON.stringify(t)}`;
export const chartLine = (c: ChartData) => `@[chart]${JSON.stringify(c)}`;

const IMG = /^!\[(.*)\]\((\S+)\)$/;
const VIDEO = /^@\[video\]\((\S+)\)$/;
const POST = /^@\[post\]\((\S+)\)$/;

export function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const last = blocks[blocks.length - 1];
    let m: RegExpMatchArray | null;
    if (line.startsWith("\\")) blocks.push({ type: "p", text: line.slice(1) });
    else if (line.startsWith("## ")) blocks.push({ type: "h", text: line.slice(3) });
    else if (/^>\s?/.test(line)) {
      const text = line.replace(/^>\s?/, "");
      if (last?.type === "quote") last.lines.push(text);
      else blocks.push({ type: "quote", lines: [text] });
    } else if (/^::\s?/.test(line)) {
      const text = line.replace(/^::\s?/, "");
      if (last?.type === "box") last.lines.push(text);
      else blocks.push({ type: "box", lines: [text] });
    } else if ((m = line.match(/^(-|\d+\.)\s+(.*)$/))) {
      const ordered = m[1] !== "-";
      if (last?.type === "list" && last.ordered === ordered) last.items.push(m[2]);
      else blocks.push({ type: "list", ordered, items: [m[2]] });
    } else if (line === "---") blocks.push({ type: "hr" });
    else if ((m = line.match(IMG))) blocks.push({ type: "img", caption: m[1], src: m[2] });
    else if ((m = line.match(VIDEO))) blocks.push({ type: "video", url: m[1] });
    else if ((m = line.match(POST))) blocks.push({ type: "post", url: m[1] });
    else if ((m = line.match(TABLE))) {
      const t = cleanTable(json(m[1]));
      if (t) blocks.push({ type: "table", ...t });
    } else if ((m = line.match(CHART))) {
      const c = cleanChart(json(m[1]));
      if (c) blocks.push({ type: "chart", ...c });
    }
    else blocks.push({ type: "p", text: line });
  }
  return blocks;
}

// "**bold**" and "[words](link)" inside a line.
export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let at = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > at) out.push({ text: text.slice(at, m.index) });
    if (m[1] !== undefined) {
      // A link inside bold words keeps both.
      for (const part of parseInline(m[1])) out.push({ ...part, bold: true });
    } else out.push({ text: m[2], href: m[3] });
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push({ text: text.slice(at) });
  return out;
}

// The words only, for summaries and word counts.
export function plainText(lines: string[]): string {
  return parseBlocks(lines)
    .flatMap((b) => {
      if (b.type === "p" || b.type === "h") return [b.text];
      if (b.type === "quote" || b.type === "box") return b.lines;
      if (b.type === "list") return b.items;
      if (b.type === "img") return [b.caption];
      return [];
    })
    .map((t) => parseInline(t).map((i) => i.text).join(""))
    .filter(Boolean)
    .join(" ");
}

// YouTube and Facebook links become players; anything else stays a link.
export function videoEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  if (/^https:\/\/(www\.|m\.|web\.)?(facebook\.com|fb\.watch)\//.test(url))
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
  return null;
}

// Posts from X, Facebook and Instagram, shown with each site's own embed; anything
// else stays a link.
// A Facebook share link ("facebook.com/share/…", what the app's Copy link gives) is only
// a forward to the post: Facebook won't show it inside another site, so it stays a link.
export type Social = { site: "x" | "facebook" | "instagram"; name: string; url: string; id?: string; short?: boolean };

export function socialPost(url: string): Social | null {
  const x = url.match(/^https:\/\/(?:www\.|mobile\.)?(?:x|twitter)\.com\/\w{1,30}\/status(?:es)?\/(\d{5,25})/);
  if (x) return { site: "x", name: "X", url, id: x[1] };
  const ig = url.match(/^https:\/\/(?:www\.)?instagram\.com\/(?:[\w.]+\/)?(p|reel|tv)\/([\w-]+)/);
  if (ig) return { site: "instagram", name: "Instagram", url: `https://www.instagram.com/${ig[1]}/${ig[2]}/` };
  if (/^https:\/\/(?:www\.|m\.|web\.)?facebook\.com\/\S+/.test(url))
    return { site: "facebook", name: "Facebook", url, short: /facebook\.com\/share\//.test(url) };
  return null;
}

// Dashboard photos come at the size the slot needs.
export function photoSrc(src: string, width: number): string {
  if (!src.includes("cdn.sanity.io")) return src;
  const base = src.split("?")[0];
  return `${base}?w=${width}&auto=format&q=75`;
}
