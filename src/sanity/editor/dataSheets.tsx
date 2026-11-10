import { type ClipboardEvent } from "react";
import { DataChart } from "@/components/RichBlocks";
import { cleanChart, type ChartData, type ChartKind, type TableData } from "@/lib/richText";

// The newsroom's Table and Chart sheets (opened from the "+" menu, or Edit on one
// already in the article). Copying cells from Excel or Google Sheets and pasting them
// into any box fills the whole table, or the chart's lines.

const MAX_ROWS = 40;
const MAX_COLS = 8;
const MAX_ITEMS = 12;

export const emptyTable = (): TableData => ({ title: "", rows: [["", "", ""], ["", "", ""], ["", "", ""]], source: "" });
export type ChartDraft = { kind: ChartKind; title: string; source: string; items: { label: string; value: string }[] };
export const emptyChart = (): ChartDraft => ({ kind: "bar", title: "", source: "", items: [{ label: "", value: "" }, { label: "", value: "" }, { label: "", value: "" }] });
export const chartToDraft = (c: ChartData): ChartDraft => ({ ...c, items: c.items.map((i) => ({ label: i.label, value: String(i.value) })) });
const toNumber = (v: string) => Number(v.replace(/[,\s]/g, "").replace(/[٫]/g, "."));
export const draftToChart = (d: ChartDraft) => cleanChart({ ...d, items: d.items.filter((i) => i.label.trim() && i.value.trim()).map((i) => ({ label: i.label, value: toNumber(i.value) })) });

// Cells copied from a spreadsheet: rows on lines, cells split by tabs.
const cells = (text: string) =>
  text
    .replace(/\r/g, "")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => l.split("\t").map((c) => c.trim()));

export function TableEditor({ value, onChange }: { value: TableData; onChange: (t: TableData) => void }) {
  const cols = Math.max(1, ...value.rows.map((r) => r.length));
  const rows = value.rows.map((r) => [...r, ...Array(cols - r.length).fill("")]);
  const set = (next: string[][]) => onChange({ ...value, rows: next });
  const paste = (e: ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData("text/plain");
    if (!/[\t\n]/.test(text.trim())) return; // one cell: an ordinary paste
    e.preventDefault();
    const got = cells(text).slice(0, MAX_ROWS).map((r) => r.slice(0, MAX_COLS));
    const width = Math.max(...got.map((r) => r.length));
    set(got.map((r) => [...r, ...Array(width - r.length).fill("")]));
  };
  return (
    <div className="dt-ed">
      <input className="re-url" dir="rtl" placeholder="ސުރުޚީ (ބޭނުންނަމަ)" value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} />
      <div className="dt-scroll">
        <div className="dt-grid" dir="rtl" style={{ gridTemplateColumns: `repeat(${cols}, minmax(84px, 1fr))` }} onPaste={paste}>
          {rows.map((row, r) =>
            row.map((c, j) => (
              <input
                key={`${r}-${j}`}
                className={`dt-cell${r === 0 ? " head" : ""}`}
                dir="auto"
                aria-label={r === 0 ? `Heading ${j + 1}` : `Row ${r}, column ${j + 1}`}
                value={c}
                onChange={(e) => set(rows.map((x, i) => (i !== r ? x : x.map((y, k) => (k === j ? e.target.value : y)))))}
              />
            )),
          )}
        </div>
      </div>
      <div className="dt-btns">
        <button type="button" className="re-pill" disabled={rows.length >= MAX_ROWS} onClick={() => set([...rows, Array(cols).fill("")])}>
          + Row
        </button>
        <button type="button" className="re-pill" disabled={cols >= MAX_COLS} onClick={() => set(rows.map((r) => [...r, ""]))}>
          + Column
        </button>
        <button type="button" className="re-pill" disabled={rows.length <= 2} onClick={() => set(rows.slice(0, -1))}>
          − Row
        </button>
        <button type="button" className="re-pill" disabled={cols <= 1} onClick={() => set(rows.map((r) => r.slice(0, -1)))}>
          − Column
        </button>
      </div>
      <input className="re-url" dir="rtl" placeholder="މަޢުލޫމާތު ލިބުނު ތަން (ބޭނުންނަމަ)" value={value.source} onChange={(e) => onChange({ ...value, source: e.target.value })} />
      <p className="ef-note">The first row is the heading. Tip: copy cells in Excel or Google Sheets and paste them into any box. A + or − in front of a number shows it green or red.</p>
    </div>
  );
}

const KINDS: { kind: ChartKind; name: string; icon: string }[] = [
  { kind: "bar", name: "Bars", icon: "M4 6h12M4 12h16M4 18h8" },
  { kind: "col", name: "Columns", icon: "M6 20v-8M12 20V6M18 20v-11" },
  { kind: "pie", name: "Circle", icon: "M12 3v9h9M21 12a9 9 0 1 1-9-9" },
];

export function ChartEditor({ value, onChange }: { value: ChartDraft; onChange: (c: ChartDraft) => void }) {
  const setItem = (k: number, part: "label" | "value", v: string) => onChange({ ...value, items: value.items.map((i, j) => (j === k ? { ...i, [part]: v } : i)) });
  const paste = (e: ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData("text/plain");
    if (!/[\t\n]/.test(text.trim())) return;
    e.preventDefault();
    const got = cells(text)
      .filter((r) => r.length >= 2)
      .slice(0, MAX_ITEMS)
      .map((r) => ({ label: r[0], value: r[1] }));
    if (got.length) onChange({ ...value, items: got });
  };
  const preview = draftToChart(value);
  return (
    <div className="dt-ed">
      <div className="dt-kinds" role="radiogroup" aria-label="Chart style">
        {KINDS.map((k) => (
          <button key={k.kind} type="button" role="radio" aria-checked={value.kind === k.kind} className="dt-kind" onClick={() => onChange({ ...value, kind: k.kind })}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={k.icon} />
            </svg>
            {k.name}
          </button>
        ))}
      </div>
      <input className="re-url" dir="rtl" placeholder="ސުރުޚީ" value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} />
      <div className="dt-items" onPaste={paste}>
        {value.items.map((i, k) => (
          <div key={k} className="dt-item">
            <input className="re-url" dir="rtl" placeholder="ނަން" aria-label={`Line ${k + 1} name`} value={i.label} onChange={(e) => setItem(k, "label", e.target.value)} />
            <input className="re-url dt-num" dir="ltr" inputMode="decimal" placeholder="0" aria-label={`Line ${k + 1} number`} value={i.value} onChange={(e) => setItem(k, "value", e.target.value)} />
            <button type="button" className="dt-x" aria-label={`Remove line ${k + 1}`} disabled={value.items.length <= 1} onClick={() => onChange({ ...value, items: value.items.filter((_, j) => j !== k) })}>
              ×
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="re-pill dt-add" disabled={value.items.length >= MAX_ITEMS} onClick={() => onChange({ ...value, items: [...value.items, { label: "", value: "" }] })}>
        + Add a line
      </button>
      <input className="re-url" dir="rtl" placeholder="މަޢުލޫމާތު ލިބުނު ތަން (ބޭނުންނަމަ)" value={value.source} onChange={(e) => onChange({ ...value, source: e.target.value })} />
      {value.kind === "pie" && <p className="ef-note">Circle: each line is a share of the whole, shown as a percentage.</p>}
      {preview && (
        <div className="re-pv dt-preview" dir="rtl">
          <DataChart data={preview} />
        </div>
      )}
    </div>
  );
}
