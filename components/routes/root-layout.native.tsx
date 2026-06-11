import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Stack } from "expo-router";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { APP_ACCENT_COLOR } from "../app-colors";
import { HabitsProvider } from "../habits-store";
import {
  ThemePreferenceProvider,
  useThemePreference,
} from "../theme-preference";

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const convexUrl =
  process.env.EXPO_PUBLIC_CONVEX_URL ?? "https://unset-practice.convex.cloud";
const convex = new ConvexReactClient(convexUrl);
const SPLASH_TIMEOUT_MS = 10_000;

preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(home)",
};

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ThemePreferenceProvider>
          <HabitsProvider>
            <ThemedLayout />
          </HabitsProvider>
        </ThemePreferenceProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

function ThemedLayout() {
  const { resolvedScheme } = useThemePreference();
  const { isLoaded, isSignedIn } = useAuth({
    treatPendingAsSignedOut: false,
  });
  const [splashTimedOut, setSplashTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashTimedOut(true), SPLASH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  const ready = isLoaded || splashTimedOut;

  useEffect(() => {
    if (ready) {
      hideAsync();
    }
  }, [ready]);

  const isDark = resolvedScheme === "dark";
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const themedNavigation = {
    ...baseTheme,
    colors: { ...baseTheme.colors, primary: APP_ACCENT_COLOR },
  };

  // Keep the native splash covering the screen until Clerk resolves the
  // persisted session (or the timeout fires) so signed-in cold starts go
  // straight to home without flashing the sign-in screen.
  if (!ready) {
    return null;
  }

  return (
    <ThemeProvider value={themedNavigation}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={Boolean(isSignedIn)}>
          <Stack.Screen name="(home)" />
        </Stack.Protected>
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
