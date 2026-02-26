import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Appearance, type ColorSchemeName, useColorScheme } from "react-native";
import "expo-sqlite/localStorage/install";

type ThemePreference = "system" | "light" | "dark";

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  resolvedScheme: "light" | "dark";
  setPreference: (preference: ThemePreference) => void;
  isLoaded: boolean;
};

const STORAGE_KEY = "practice.themePreference";

const ThemePreferenceContext =
  createContext<ThemePreferenceContextValue | null>(null);

const resolveScheme = (
  preference: ThemePreference,
  systemScheme: ColorSchemeName,
): "light" | "dark" => {
  if (preference === "system") {
    return systemScheme === "dark" ? "dark" : "light";
  }
  return preference;
};

const applyAppearancePreference = (preference: ThemePreference) => {
  if (preference === "system") {
    Appearance.setColorScheme("unspecified");
    return;
  }
  Appearance.setColorScheme(preference);
};

const loadInitialPreference = (): ThemePreference => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") {
      applyAppearancePreference(saved);
      return saved;
    }
  } catch {
    // Ignore read errors on startup
  }
  return "system";
};

export function ThemePreferenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(
    loadInitialPreference,
  );

  const setPreference = useCallback((newPreference: ThemePreference) => {
    setPreferenceState(newPreference);
    applyAppearancePreference(newPreference);
    try {
      localStorage.setItem(STORAGE_KEY, newPreference);
    } catch {
      // Ignore write errors
    }
  }, []);

  const resolvedScheme = useMemo(
    () => resolveScheme(preference, systemScheme),
    [preference, systemScheme],
  );

  const value = useMemo(
    () => ({
      preference,
      resolvedScheme,
      setPreference,
      isLoaded: true,
    }),
    [preference, resolvedScheme, setPreference],
  );

  return (
    <ThemePreferenceContext.Provider value={value}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);
  if (!context) {
    throw new Error(
      "useThemePreference must be used within ThemePreferenceProvider",
    );
  }
  return context;
}
