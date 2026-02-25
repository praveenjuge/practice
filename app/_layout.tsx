import React from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { APP_ACCENT_COLOR } from "../components/app-colors";
import {
  ThemePreferenceProvider,
  useThemePreference,
} from "../components/theme-preference";
import { HabitsProvider } from "../components/habits-store";

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
  const isDark = resolvedScheme === "dark";
  const themedNavigation = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, primary: APP_ACCENT_COLOR } }
    : {
        ...DefaultTheme,
        colors: { ...DefaultTheme.colors, primary: APP_ACCENT_COLOR },
      };

  return (
    <ThemeProvider value={themedNavigation}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Slot />
    </ThemeProvider>
  );
}
