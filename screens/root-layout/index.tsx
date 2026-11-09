import { Column, Host, Text } from "@expo/ui";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { FONT_SUBHEAD, usePalette } from "../../components/web/palette";
import { APP_ACCENT_COLOR, HOST_THEME } from "../../lib/app-colors";
import { HabitsProvider } from "../../lib/habits-store";
import { restoreSession, useSession } from "../../lib/session";
import {
  ThemePreferenceProvider,
  useThemePreference,
} from "../../lib/theme-preference";

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
  const isSignedIn = session.status === "signedIn";
  const isDark = resolvedScheme === "dark";
  const palette = usePalette();

  // Gate routing until the session is restored so we never mount the
  // (auth) group while the refresh cookie is being checked.
  if (session.status === "loading") {
    return (
      <Host
        {...HOST_THEME}
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
          contentStyle: { backgroundColor: APP_ACCENT_COLOR },
          headerShown: false,
        }}
      >
        <Stack.Protected guard={isSignedIn} redirectTo="/sign-in">
          <Stack.Screen name="(home)" />
        </Stack.Protected>
        <Stack.Protected guard={!isSignedIn} redirectTo="/">
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
