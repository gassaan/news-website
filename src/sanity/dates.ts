// Dates in Dhivehi for the dashboard: "19 އޯގަސްޓް 2026 · 20:14" in Maldives time (UTC+5).
// Date-only values ("2026-08-19") show no time.
export const DHIVEHI_MONTHS = [
  "ޖެނުއަރީ", "ފެބްރުއަރީ", "މާރިޗު", "އޭޕްރީލް", "މޭ", "ޖޫން",
  "ޖުލައި", "އޯގަސްޓް", "ސެޕްޓެމްބަރު", "އޮކްޓޯބަރު", "ނޮވެމްބަރު", "ޑިސެމްބަރު",
];

export function formatWhen(value?: string): string {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return `${d} ${DHIVEHI_MONTHS[m - 1]} ${y}`;
  }
  const mv = new Date(new Date(value).getTime() + 5 * 60 * 60 * 1000).toISOString();
  const [y, m, d] = mv.slice(0, 10).split("-").map(Number);
  return `${d} ${DHIVEHI_MONTHS[m - 1]} ${y} · ${mv.slice(11, 16)}`;
}
