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
import { restoreSession, useSession } from "../session";
import {
  ThemePreferenceProvider,
  useThemePreference,
} from "../theme-preference";

const SPLASH_TIMEOUT_MS = 10_000;

preventAutoHideAsync();
restoreSession();

export const unstable_settings = {
  anchor: "(home)",
};

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <HabitsProvider>
        <ThemedLayout />
      </HabitsProvider>
    </ThemePreferenceProvider>
  );
}

function ThemedLayout() {
  const { resolvedScheme } = useThemePreference();
  const session = useSession();
  const isLoaded = session.status !== "loading";
  const isSignedIn = session.status === "signedIn";
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

  // Keep the native splash covering the screen until the stored session
  // is restored (or the timeout fires) so signed-in cold starts go
  // straight to home without flashing the sign-in screen.
  if (!ready) {
    return null;
  }

  return (
    <ThemeProvider value={themedNavigation}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={isSignedIn} redirectTo="/sign-in">
          <Stack.Screen name="(home)" />
        </Stack.Protected>
        <Stack.Protected guard={!isSignedIn} redirectTo="/">
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
