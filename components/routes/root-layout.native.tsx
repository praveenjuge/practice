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
import { StatusBar } from "expo-status-bar";
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
  const isDark = resolvedScheme === "dark";
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const themedNavigation = {
    ...baseTheme,
    colors: { ...baseTheme.colors, primary: APP_ACCENT_COLOR },
  };

  return (
    <ThemeProvider value={themedNavigation}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(home)" />
        <Stack.Screen name="(auth)" options={{ presentation: "modal" }} />
      </Stack>
    </ThemeProvider>
  );
}
