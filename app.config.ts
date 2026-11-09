import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  android: {
    adaptiveIcon: {
      backgroundColor: "#34c759",
      foregroundImage: "./assets/icon.png",
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
    buildNumber: "10",
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
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
        image: "./assets/icon.png",
        imageWidth: 200,
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
