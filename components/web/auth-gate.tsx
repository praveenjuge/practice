import { Column, Host, Text } from "@expo/ui";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { HOST_THEME } from "../app-colors";
import { signIn } from "../session";
import { DANGER_COLOR, FONT_SUBHEAD, usePalette } from "./palette";
import { AppButton } from "./pointer";

export function AuthGate() {
  const palette = usePalette();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = useCallback(() => {
    setBusy(true);
    setError(null);
    signIn()
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error ? reason.message : "Please try again."
        );
      })
      .finally(() => setBusy(false));
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: palette.page }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.panel,
            borderColor: palette.border,
            boxShadow: palette.shadow,
          },
        ]}
      >
        <Host matchContents {...HOST_THEME}>
          <Column alignment="center" spacing={18}>
            <Text
              textStyle={{
                color: palette.text,
                fontSize: 28,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              Practice
            </Text>
            <Text
              textStyle={{
                color: palette.secondary,
                fontSize: FONT_SUBHEAD,
                lineHeight: 22,
                textAlign: "center",
              }}
            >
              Track your habits and build streaks. Sign in to get started.
            </Text>
            <AppButton
              label={busy ? "Signing in…" : "Continue"}
              onPress={handleSignIn}
            />
            {error ? (
              <Text
                textStyle={{
                  color: DANGER_COLOR,
                  fontSize: 14,
                  textAlign: "center",
                }}
              >
                {error}
              </Text>
            ) : null}
          </Column>
        </Host>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    maxWidth: 420,
    padding: 36,
    width: "100%",
  },
  root: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
});
