import { isDynamicColorAvailable } from "@expo/ui/jetpack-compose";

export const APP_ACCENT_COLOR = "#34c759";

// Theme for every @expo/ui Host on Android. On Android 12+ surfaces follow
// the wallpaper (Material You) and only the primary role keeps the brand
// green; older devices get a palette seeded from the brand green.
export const HOST_THEME = isDynamicColorAvailable
  ? { colorOverrides: { onPrimary: "#FFFFFFFF", primary: "#34C759FF" } }
  : {
      colorOverrides: { onPrimary: "#FFFFFFFF", primary: "#34C759FF" },
      seedColor: APP_ACCENT_COLOR,
    };
