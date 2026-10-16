// The small online service (api/) that keeps view counts, poll votes, story ratings and
// comment likes, and takes in new comments. Its address is set when the site is built;
// without it the site shows its earlier sample numbers.
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
export const apiOn = API_URL !== "";

// A random id this browser keeps, so each device votes and rates once.
export function voterId(): string {
  try {
    let id = localStorage.getItem("hulhangu-voter");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("hulhangu-voter", id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export async function apiGet<T>(path: string): Promise<T | null> {
  if (!apiOn) return null;
  try {
    const res = await fetch(`${API_URL}${path}`);
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

export async function apiPost<T>(path: string, data: unknown): Promise<T | null> {
  if (!apiOn) return null;
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

// Remember small facts on this device (what was voted, which page was counted).
export function remember(key: string, value?: string): string | null {
  try {
    if (value !== undefined) localStorage.setItem(key, value);
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

// "5 ގަޑިއިރު ކުރިން" style times for comments.
export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "މިހާރު";
  if (s < 3600) return `${Math.floor(s / 60)} މިނިޓު ކުރިން`;
  if (s < 86400) return `${Math.floor(s / 3600)} ގަޑިއިރު ކުރިން`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} ދުވަސް ކުރިން`;
  if (s < 86400 * 365) return `${Math.floor(s / (86400 * 30))} މަސް ކުރިން`;
  return `${Math.floor(s / (86400 * 365))} އަހަރު ކުރިން`;
}
