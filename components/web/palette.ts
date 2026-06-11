import { APP_ACCENT_COLOR } from "../app-colors";
import { useThemePreference } from "../theme-preference";

// Palette is the theming mechanism on web: @expo/ui universal components have
// no cross-platform theming system (`Host` colorScheme is native-only), so we
// drive colors from the existing theme-preference store.

export const DANGER_COLOR = "#ff3b30";

// iOS type scale (points).
export const FONT_BODY = 17;
export const FONT_SUBHEAD = 15;
export const FONT_CAPTION = 13;

export interface Palette {
  accent: string;
  accentSoft: string;
  border: string;
  fieldBg: string;
  hairline: string;
  hover: string;
  page: string;
  panel: string;
  secondary: string;
  shadow: string;
  sidebar: string;
  text: string;
  track: string;
}

const DARK_PALETTE: Palette = {
  accent: APP_ACCENT_COLOR,
  accentSoft: `${APP_ACCENT_COLOR}33`,
  border: "#2a2a2c",
  fieldBg: "#1c1c1e",
  hairline: "#38383a",
  hover: "rgba(255,255,255,0.06)",
  page: "#000000",
  panel: "#1c1c1e",
  secondary: "#98989f",
  shadow: "none",
  sidebar: "#141416",
  text: "#f5f5f7",
  track: "#2c2c2e",
};

const LIGHT_PALETTE: Palette = {
  accent: APP_ACCENT_COLOR,
  accentSoft: `${APP_ACCENT_COLOR}1f`,
  border: "#e4e4e9",
  fieldBg: "#ffffff",
  hairline: "#d2d2d7",
  hover: "rgba(0,0,0,0.035)",
  page: "#f5f5f7",
  panel: "#ffffff",
  secondary: "#6e6e73",
  shadow: "0px 1px 2px rgba(0,0,0,0.04), 0px 8px 24px rgba(0,0,0,0.05)",
  sidebar: "#fbfbfd",
  text: "#1d1d1f",
  track: "#e8e8ed",
};

export function usePalette(): Palette {
  const { resolvedScheme } = useThemePreference();
  return resolvedScheme === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
}
