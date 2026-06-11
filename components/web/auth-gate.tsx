import { Column, Host, Text } from "@expo/ui";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { DANGER_COLOR, FONT_SUBHEAD, usePalette } from "./palette";
import { AppButton } from "./pointer";

const WEB_SIGN_IN_URL = process.env.EXPO_PUBLIC_CLERK_SIGN_IN_URL ?? "";

export function openHostedSignIn() {
  if (!WEB_SIGN_IN_URL || typeof window === "undefined") {
    router.replace("/");
    return;
  }
  const url = new URL(WEB_SIGN_IN_URL);
  url.searchParams.set(
    "redirect_url",
    new URL("/", window.location.origin).href
  );
  window.location.href = url.href;
}

export function AuthGate() {
  const palette = usePalette();
  return (
    <View style={[styles.root, { backgroundColor: palette.page }]}>
      <Host
        matchContents
        style={[
          styles.card,
          {
            backgroundColor: palette.panel,
            borderColor: palette.border,
            boxShadow: palette.shadow,
          },
        ]}
      >
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
          <AppButton label="Continue with Clerk" onPress={openHostedSignIn} />
          {WEB_SIGN_IN_URL ? null : (
            <Text
              textStyle={{
                color: DANGER_COLOR,
                fontSize: 14,
                textAlign: "center",
              }}
            >
              Set EXPO_PUBLIC_CLERK_SIGN_IN_URL to enable hosted web sign-in.
            </Text>
          )}
        </Column>
      </Host>
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
