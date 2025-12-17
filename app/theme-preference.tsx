import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, ColorSchemeName, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemePreference = "system" | "light" | "dark";

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  resolvedScheme: Exclude<ColorSchemeName, null>;
  setPreference: (preference: ThemePreference) => void;
  isLoaded: boolean;
};

const STORAGE_KEY = "practice.themePreference";

const ThemePreferenceContext =
  createContext<ThemePreferenceContextValue | null>(null);

const resolveScheme = (
  preference: ThemePreference,
  systemScheme: ColorSchemeName
): Exclude<ColorSchemeName, null> => {
  if (preference === "system") {
    return systemScheme ?? "light";
  }
  return preference;
};

const applyAppearancePreference = (preference: ThemePreference) => {
  if (preference === "system") {
    Appearance.setColorScheme(null);
    return;
  }
  Appearance.setColorScheme(preference);
};

export function ThemePreferenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "light" || saved === "dark" || saved === "system") {
          setPreferenceState(saved);
          applyAppearancePreference(saved);
        }
      } catch (error) {
        console.error("Failed to load theme preference:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadPreference();
  }, []);

  const setPreference = useCallback(async (newPreference: ThemePreference) => {
    setPreferenceState(newPreference);
    applyAppearancePreference(newPreference);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newPreference);
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  }, []);

  const resolvedScheme = useMemo(
    () => resolveScheme(preference, systemScheme),
    [preference, systemScheme]
  );

  const value = useMemo(
    () => ({
      preference,
      resolvedScheme,
      setPreference,
      isLoaded,
    }),
    [preference, resolvedScheme, setPreference, isLoaded]
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
      "useThemePreference must be used within ThemePreferenceProvider"
    );
  }
  return context;
}
