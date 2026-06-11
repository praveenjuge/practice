import type { ExpoConfig } from "expo/config";

const googleWebClientId = process.env.EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID;
const googleAndroidClientId =
  process.env.EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID;
const googleIosClientId = process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID;
const googleIosUrlScheme = process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME;

const config: ExpoConfig = {
  name: "Practice",
  slug: "practice",
  version: "1.2.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  scheme: "practice",
  ios: {
    supportsTablet: false,
    icon: "./assets/icon.png",
    bundleIdentifier: "com.praveenjuge.practice",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  plugins: [
    [
      "expo-router",
      {
        asyncRoutes: { default: "development", web: true },
      },
    ],
    [
      "@clerk/expo",
      {
        appleSignIn: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
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
  experiments: {
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "9dcaabde-e8e9-4eaf-b603-faa06acc6707",
    },
    EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID: googleWebClientId,
    EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID: googleAndroidClientId,
    EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID: googleIosClientId,
    EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME: googleIosUrlScheme,
  },
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
  web: {
    output: "single",
  },
};

export default { expo: config };
