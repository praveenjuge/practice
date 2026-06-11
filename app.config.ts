import appJson from "./app.json";

const googleWebClientId = process.env.EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID;
const googleAndroidClientId =
  process.env.EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID;
const googleIosClientId = process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID;
const googleIosUrlScheme = process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME;

export default {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID: googleWebClientId,
      EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID: googleAndroidClientId,
      EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID: googleIosClientId,
      EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME: googleIosUrlScheme,
    },
  },
};
