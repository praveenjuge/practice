import React from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import {
  ThemePreferenceProvider,
  useThemePreference,
} from "../components/theme-preference";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { StatusBar } from "expo-status-bar";
import { PlatformColor } from "react-native";

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <ThemedLayout />
    </ThemePreferenceProvider>
  );
}

function ThemedLayout() {
  const { resolvedScheme } = useThemePreference();
  const isDark = resolvedScheme === "dark";

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <NativeTabs
        tintColor={PlatformColor("systemGreen") as unknown as string}
        iconColor={{
          selected: PlatformColor("systemGreen") as unknown as string,
        }}
        backgroundColor="transparent"
      >
        <NativeTabs.Trigger name="(home)">
          <Label>Home</Label>
          <Icon sf="house" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="settings">
          <Label>Settings</Label>
          <Icon sf="gear" />
        </NativeTabs.Trigger>
      </NativeTabs>
    </ThemeProvider>
  );
}
