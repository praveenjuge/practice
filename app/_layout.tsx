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
import { APP_ACCENT_COLOR } from "../components/app-colors";
import { HabitsProvider } from "../components/habits-store";
import {
  ThemePreferenceProvider,
  useThemePreference,
} from "../components/theme-preference";

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
  const themedNavigation = isDark
    ? {
        ...DarkTheme,
        colors: { ...DarkTheme.colors, primary: APP_ACCENT_COLOR },
      }
    : {
        ...DefaultTheme,
        colors: { ...DefaultTheme.colors, primary: APP_ACCENT_COLOR },
      };

  return (
    <ThemeProvider value={themedNavigation}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(home)" />
        <Stack.Screen
          name="(auth)"
          options={{
            presentation: "modal",
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
