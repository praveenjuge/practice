import CalendarIcon from "@expo/material-symbols/calendar_month.xml";
import CheckIcon from "@expo/material-symbols/check_circle.xml";
import FireIcon from "@expo/material-symbols/local_fire_department.xml";
import SyncIcon from "@expo/material-symbols/sync.xml";
import { Button, Column, Host, Icon, Row, Text } from "@expo/ui";
import { Stack } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, PlatformColor, StyleSheet, View } from "react-native";
import appIcon from "../../assets/icon.png";
import { APP_ACCENT_COLOR, HOST_THEME } from "../../lib/app-colors";
import { signIn } from "../../lib/session";
import {
  WELCOME_FEATURES,
  WELCOME_SUBTITLE,
  WELCOME_TITLE,
  type WelcomeFeatureKey,
} from "../../lib/welcome-copy";

// Cross-platform (Android) sign-in screen; iOS uses sign-in-screen.ios.tsx.

const ICON_SIZE = 96;
const SECONDARY_TEXT = PlatformColor(
  "?android:attr/textColorSecondary"
) as unknown as string;

const FEATURE_ICONS: Record<WelcomeFeatureKey, number> = {
  checkins: CheckIcon,
  history: CalendarIcon,
  streaks: FireIcon,
  sync: SyncIcon,
};

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
        <Image source={appIcon} style={styles.icon} />
        <Host
          {...HOST_THEME}
          matchContents={{ vertical: true }}
          style={styles.host}
        >
          <Column alignment="center" spacing={28}>
            <Column alignment="center" spacing={8}>
              <Text textStyle={{ fontSize: 32, fontWeight: "700" }}>
                {WELCOME_TITLE}
              </Text>
              <Text
                textStyle={{
                  color: SECONDARY_TEXT,
                  fontSize: 16,
                  textAlign: "center",
                }}
              >
                {WELCOME_SUBTITLE}
              </Text>
            </Column>
            <Column alignment="start" spacing={20}>
              {WELCOME_FEATURES.map((feature) => (
                <Row alignment="start" key={feature.key} spacing={16}>
                  <Icon
                    color={APP_ACCENT_COLOR}
                    name={FEATURE_ICONS[feature.key]}
                    size={26}
                  />
                  <Column alignment="start" spacing={2}>
                    <Text textStyle={{ fontSize: 16, fontWeight: "600" }}>
                      {feature.title}
                    </Text>
                    <Text textStyle={{ color: SECONDARY_TEXT, fontSize: 14 }}>
                      {feature.detail}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Column>
          </Column>
        </Host>
      </View>
      <Host
        {...HOST_THEME}
        matchContents={{ vertical: true }}
        style={styles.host}
      >
        <Column alignment="center" spacing={14}>
          <Button
            disabled={busy}
            label={busy ? "Signing in…" : "Continue"}
            onPress={handleSignIn}
            style={{ height: 52, width: "100%" }}
          />
        </Column>
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
    borderRadius: ICON_SIZE / 2,
    height: ICON_SIZE,
    width: ICON_SIZE,
  },
  root: {
    flex: 1,
    paddingBottom: 40,
    paddingHorizontal: 28,
    paddingTop: 64,
  },
});
