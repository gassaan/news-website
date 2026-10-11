import { color } from "@sanity/color";
import { buildTheme } from "@sanity/ui/theme";

// The dashboard in the website's colours. Sanity builds every surface from a
// grey scale and every highlight from a blue one, so both are swapped for the
// site's purples: dark mode sits on the site's deep purple, light mode on its
// lavender, and buttons, links and selected rows use the site's accent.
const purpleGray = {
  50: "#f7f2ff",
  100: "#efe8ff",
  200: "#e1d5ff",
  300: "#c9b6f5",
  400: "#a796d6",
  500: "#7f6eaa",
  600: "#5b4691",
  700: "#3e2a72",
  800: "#270e61",
  900: "#150735",
  950: "#0e0426",
};

const accent = {
  50: "#f4efff",
  100: "#e9dfff",
  200: "#d6c5ff",
  300: "#c0a6ff",
  400: "#a882ff",
  500: "#8f66f0",
  600: "#7958c5",
  700: "#5f40a8",
  800: "#4a2f8c",
  900: "#3e2180",
  950: "#2a1260",
};

const tints = (hex: Record<number, string>, name: string) =>
  Object.fromEntries(Object.entries(hex).map(([k, v]) => [k, { title: `${name} ${k}`, hex: v }]));

export const studioTheme = buildTheme({
  palette: {
    ...color,
    black: { title: "Black", hex: "#080018" },
    white: { title: "White", hex: "#fbf8ff" },
    gray: tints(purpleGray, "Purple gray"),
    blue: tints(accent, "Lavender"),
    purple: tints(accent, "Lavender"),
  } as typeof color,
  // Rounder corners, closer to the site's cards and pill buttons.
  radius: [0, 4, 12, 16, 20, 24, 28],
});
