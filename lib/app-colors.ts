export const APP_ACCENT_COLOR = "#34c759";

// Theme for every @expo/ui Host. seedColor is the SwiftUI tint on iOS and the
// web primary scale; on Android it seeds a Material palette whose generated
// primary is a darker green, so the exact brand green is set as primary too.
export const HOST_THEME = {
  colorOverrides: { onPrimary: "#FFFFFFFF", primary: "#34C759FF" },
  seedColor: APP_ACCENT_COLOR,
} as const;
