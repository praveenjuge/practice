import type { ExpoConfig } from "expo/config";

// Kept outside the config literal: ExpoConfig's types don't list
// noxcturnalTransformWorker yet, though Expo CLI reads it (SDK 58).
const EXPERIMENTS = {
  // Swift and Kotlin in these folders compile into the app: Siri and
  // Spotlight (app-intents/), the year heatmap and the Android widget
  // reader (native/).
  inlineModules: { watchedDirectories: ["app-intents", "native"] },
  // Rust (oxc) Metro transformer, about 2x faster cold bundling. Possible
  // now that no Reanimated/Worklets Babel transforms are needed.
  noxcturnalTransformWorker: true,
  reactCompiler: true,
};

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
    // Bump for every Google Play upload.
    versionCode: 2,
  },
  experiments: EXPERIMENTS,
  extra: {
    router: {},
  },
  ios: {
    appleTeamId: "LW385M78LW",
    // Bump for every App Store upload; it must be higher than any build
    // already uploaded (see TestFlight in App Store Connect).
    buildNumber: "12",
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
    "expo-app-intents",
    // Must come before expo-widgets; see the plugin.
    "./plugins/with-check-in-control.js",
    [
      "expo-widgets",
      {
        enableAndroid: true,
        groupIdentifier: "group.com.praveenjuge.practice",
        widgets: [
          {
            android: {
              initialLayout: "widgets/today-widget.android.tsx",
              targetCellHeight: 2,
              targetCellWidth: 3,
            },
            description: "Check in today's habits.",
            displayName: "Today",
            ios: {
              initialLayout: "widgets/today-widget.ios.tsx",
              supportedFamilies: ["systemSmall", "systemMedium", "systemLarge"],
            },
            name: "TodayWidget",
          },
          {
            android: null,
            description: "How many of today's habits are done.",
            displayName: "Progress",
            ios: {
              initialLayout: "widgets/progress-widget.ios.tsx",
              supportedFamilies: [
                "accessoryCircular",
                "accessoryRectangular",
                "accessoryInline",
              ],
            },
            name: "ProgressWidget",
          },
        ],
      },
    ],
  ],
  scheme: "practice",
  slug: "practice",
  userInterfaceStyle: "automatic",
  version: "2.1.0",
  web: {
    // Expo generates favicon.ico from this and links it in index.html.
    // The rest of the page head lives in public/index.html.
    favicon: "./assets/icon.png",
    output: "single",
  },
};

export default { expo: config };
