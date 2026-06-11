import { useAuth } from "@clerk/expo";
import { AuthView } from "@clerk/expo/native";
import { Button, Column, Host, Row, Spacer, Text } from "@expo/ui";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

interface NativeAuthEntryProps {
  title?: string;
}

export function NativeAuthEntry({ title = "Practice" }: NativeAuthEntryProps) {
  const { isSignedIn } = useAuth({
    treatPendingAsSignedOut: false,
  });
  const [showAuthView, setShowAuthView] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      router.replace("/");
    }
  }, [isSignedIn]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false, title }} />
      {showAuthView ? (
        <View style={{ flex: 1 }}>
          <Host style={{ height: 88 }}>
            <Row
              alignment="center"
              spacing={12}
              style={{ paddingHorizontal: 20, paddingTop: 20 }}
            >
              <Text textStyle={{ fontSize: 16, fontWeight: "600" }}>
                Sign in
              </Text>
              <Spacer flexible />
              <Button
                label="Close"
                onPress={() => setShowAuthView(false)}
                variant="text"
              />
            </Row>
          </Host>
          <View style={{ flex: 1 }}>
            <AuthView isDismissable mode="signInOrUp" />
          </View>
        </View>
      ) : (
        <Host style={{ flex: 1 }}>
          <Column alignment="center" spacing={18} style={{ padding: 28 }}>
            <Spacer flexible />
            <Text
              textStyle={{
                fontSize: 24,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              Practice
            </Text>
            <Text
              textStyle={{
                color: "#6b7280",
                fontSize: 15,
                textAlign: "center",
              }}
            >
              Sign in to sync habits with Convex on this device.
            </Text>
            <Button label="Continue" onPress={() => setShowAuthView(true)} />
            <Spacer flexible />
          </Column>
        </Host>
      )}
    </>
  );
}
