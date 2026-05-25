import { ClerkProvider, useAuth } from "@clerk/expo";
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

  return (
    <>
      <StatusBar style={resolvedScheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: APP_ACCENT_COLOR },
        }}
      >
        <Stack.Screen name="(home)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </>
  );
}
