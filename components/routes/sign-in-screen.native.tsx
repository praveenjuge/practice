import { Button, Column, Host, Text } from "@expo/ui";
import { Stack } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Platform, PlatformColor, StyleSheet, View } from "react-native";
import { HOST_THEME } from "../app-colors";
import { signIn } from "../session";

const SECONDARY_TEXT = PlatformColor(
  Platform.OS === "ios" ? "secondaryLabel" : "?android:attr/textColorSecondary"
) as unknown as string;

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
      <Host matchContents {...HOST_THEME}>
        <Column alignment="center" spacing={12}>
          <Text textStyle={{ fontSize: 34, fontWeight: "700" }}>Practice</Text>
          <Text
            textStyle={{
              color: SECONDARY_TEXT,
              fontSize: 17,
              textAlign: "center",
            }}
          >
            Track your habits and build streaks.
          </Text>
          <Button
            disabled={busy}
            label={busy ? "Signing in…" : "Continue"}
            onPress={handleSignIn}
          />
        </Column>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 32,
  },
});
