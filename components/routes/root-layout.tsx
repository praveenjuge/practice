import { ClerkProvider, useAuth } from "@clerk/expo";
import { Column, Host, Text } from "@expo/ui";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { APP_ACCENT_COLOR } from "../app-colors";
import { HabitsProvider } from "../habits-store";
import {
  ThemePreferenceProvider,
  useThemePreference,
} from "../theme-preference";
import { FONT_SUBHEAD, usePalette } from "../web/palette";

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const convexUrl =
  process.env.EXPO_PUBLIC_CONVEX_URL ?? "https://unset-practice.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

export const unstable_settings = {
  anchor: "(home)",
};

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
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
  const { isLoaded, isSignedIn } = useAuth();
  const isDark = resolvedScheme === "dark";
  const palette = usePalette();

  // Gate routing until Clerk restores the session so we never mount the
  // (auth) group during session restore on the web.
  if (!isLoaded) {
    return (
      <Host
        style={{
          alignItems: "center",
          backgroundColor: palette.page,
          flex: 1,
          justifyContent: "center",
        }}
      >
        <Column alignment="center">
          <Text
            textStyle={{ color: palette.secondary, fontSize: FONT_SUBHEAD }}
          >
            Loading…
          </Text>
        </Column>
      </Host>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: APP_ACCENT_COLOR },
        }}
      >
        <Stack.Protected guard={Boolean(isSignedIn)}>
          <Stack.Screen name="(home)" />
        </Stack.Protected>
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
