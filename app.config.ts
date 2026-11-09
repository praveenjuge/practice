import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  android: {
    // Badge-only layers sized for Android's safe zone, so launcher masks
    // (circle, squircle) never clip it.
    adaptiveIcon: {
      backgroundColor: "#28CD41",
      foregroundImage: "./assets/adaptive-icon.png",
      monochromeImage: "./assets/adaptive-icon-monochrome.png",
    },
    blockedPermissions: [
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
    ],
    icon: "./assets/icon.png",
    package: "com.praveenjuge.practice",
  },
  experiments: {
    reactCompiler: true,
  },
  extra: {
    router: {},
  },
  ios: {
    appleTeamId: "LW385M78LW",
    // Bump for every App Store upload; it must be higher than any build
    // already uploaded (see TestFlight in App Store Connect).
    buildNumber: "11",
    bundleIdentifier: "com.praveenjuge.practice",
    icon: "./assets/icon.png",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    supportsTablet: false,
  },
  name: "Practice",
  orientation: "portrait",
  plugins: [
    [
      "expo-router",
      {
        asyncRoutes: { default: "development", web: true },
      },
    ],
    [
      "expo-splash-screen",
      {
        // The icon's own green, so the white badge sits on one solid color.
        backgroundColor: "#28CD41",
        dark: {
          backgroundColor: "#28CD41",
        },
        image: "./assets/icon.png",
        imageWidth: 180,
        resizeMode: "contain",
      },
    ],
    "expo-font",
    "expo-status-bar",
    [
      "expo-build-properties",
      {
        ios: {
          deploymentTarget: "17.0",
        },
      },
    ],
    "expo-secure-store",
    "expo-web-browser",
  ],
  scheme: "practice",
  slug: "practice",
  userInterfaceStyle: "automatic",
  version: "2.0.0",
  web: {
    output: "single",
  },
};

export default { expo: config };
