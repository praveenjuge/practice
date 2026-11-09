import { Button, Host, HStack, Image, Text, VStack } from "@expo/ui/swift-ui";
import {
  buttonStyle,
  controlSize,
  font,
  foregroundStyle,
  frame,
  multilineTextAlignment,
} from "@expo/ui/swift-ui/modifiers";
import { Stack } from "expo-router";
import { type ComponentProps, useCallback, useState } from "react";
import {
  Alert,
  PlatformColor,
  Image as RNImage,
  StyleSheet,
  View,
} from "react-native";
import appIcon from "../../assets/icon.png";
import { APP_ACCENT_COLOR, HOST_THEME } from "../app-colors";
import { signIn } from "../session";
import {
  WELCOME_FEATURES,
  WELCOME_SUBTITLE,
  WELCOME_TITLE,
  type WelcomeFeatureKey,
} from "../welcome-copy";

const ICON_SIZE = 96;
const FEATURE_ICON_WIDTH = 32;
const FULL_WIDTH = Number.POSITIVE_INFINITY;

type SymbolName = NonNullable<ComponentProps<typeof Image>["systemName"]>;

const FEATURE_SYMBOLS: Record<WelcomeFeatureKey, SymbolName> = {
  checkins: "checkmark.circle.fill",
  history: "calendar",
  streaks: "flame.fill",
  sync: "arrow.triangle.2.circlepath",
};

const secondary = foregroundStyle({ style: "secondary", type: "hierarchical" });

export default function SignInScreen() {
  const [busy, setBusy] = useState(false);

  const handleSignIn = useCallback(() => {
    setBusy(true);
    signIn()
      .catch((error: unknown) => {
        Alert.alert(
          "Couldn't sign in",
          error instanceof Error ? error.message : "Please try again."
        );
      })
      .finally(() => setBusy(false));
  }, []);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false, title: "Sign in" }} />
      <View style={styles.content}>
        <RNImage
          accessibilityIgnoresInvertColors
          source={appIcon}
          style={styles.icon}
        />
        <Host
          {...HOST_THEME}
          matchContents={{ vertical: true }}
          style={styles.host}
        >
          <VStack modifiers={[frame({ maxWidth: FULL_WIDTH })]} spacing={28}>
            <VStack modifiers={[frame({ maxWidth: FULL_WIDTH })]} spacing={8}>
              <Text modifiers={[font({ size: 34, weight: "bold" })]}>
                {WELCOME_TITLE}
              </Text>
              <Text
                modifiers={[
                  font({ textStyle: "body" }),
                  secondary,
                  multilineTextAlignment("center"),
                ]}
              >
                {WELCOME_SUBTITLE}
              </Text>
            </VStack>
            <VStack alignment="leading" spacing={22}>
              {WELCOME_FEATURES.map((feature) => (
                <HStack alignment="top" key={feature.key} spacing={16}>
                  <Image
                    color={APP_ACCENT_COLOR}
                    modifiers={[frame({ width: FEATURE_ICON_WIDTH })]}
                    size={24}
                    systemName={FEATURE_SYMBOLS[feature.key]}
                  />
                  <VStack alignment="leading" spacing={2}>
                    <Text modifiers={[font({ textStyle: "headline" })]}>
                      {feature.title}
                    </Text>
                    <Text
                      modifiers={[
                        font({ textStyle: "subheadline" }),
                        secondary,
                      ]}
                    >
                      {feature.detail}
                    </Text>
                  </VStack>
                </HStack>
              ))}
            </VStack>
          </VStack>
        </Host>
      </View>
      <Host
        {...HOST_THEME}
        matchContents={{ vertical: true }}
        style={styles.host}
      >
        <VStack spacing={14}>
          <Button
            modifiers={[buttonStyle("borderedProminent"), controlSize("large")]}
            onPress={handleSignIn}
          >
            <Text
              modifiers={[
                font({ textStyle: "headline" }),
                frame({ maxWidth: FULL_WIDTH }),
              ]}
            >
              {busy ? "Signing in…" : "Continue"}
            </Text>
          </Button>
        </VStack>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    flex: 1,
    gap: 24,
    justifyContent: "center",
  },
  host: { width: "100%" },
  icon: {
    borderRadius: ICON_SIZE * 0.2237,
    height: ICON_SIZE,
    width: ICON_SIZE,
  },
  root: {
    backgroundColor: PlatformColor("systemBackground"),
    flex: 1,
    paddingBottom: 48,
    paddingHorizontal: 28,
    paddingTop: 72,
  },
});
