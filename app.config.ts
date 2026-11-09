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
    eas: {
      projectId: "9dcaabde-e8e9-4eaf-b603-faa06acc6707",
    },
    router: {},
  },
  ios: {
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
  version: "1.2.0",
  web: {
    output: "single",
  },
};

export default { expo: config };
