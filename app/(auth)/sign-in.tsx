import { useAuth } from "@clerk/expo";
import { AuthView } from "@clerk/expo/native";
import { Button, Host, HStack, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import {
  buttonStyle,
  controlSize,
  font,
  foregroundStyle,
  multilineTextAlignment,
  padding,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { PlatformColor, View } from "react-native";

export default function SignInScreen() {
  const { isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  const [authViewKey, setAuthViewKey] = useState(0);
  const [authViewMounted, setAuthViewMounted] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      router.replace("/");
    }
  }, [isSignedIn]);

  const openAuthView = () => {
    setAuthViewKey((key) => key + 1);
    setAuthViewMounted(true);
  };

  const secondaryStyle = foregroundStyle({
    type: "hierarchical",
    style: "secondary",
  });

  return (
    <>
      <Stack.Screen options={{ title: "Login" }} />
      <Host style={{ flex: 1 }}>
        <VStack
          modifiers={[padding({ horizontal: 28, bottom: 32 })]}
          spacing={28}
        >
          <Spacer />
          <VStack spacing={10}>
            <Text
              modifiers={[
                font({ size: 20, weight: "bold" }),
                multilineTextAlignment("center"),
              ]}
            >
              Sync your Practice
            </Text>
            <Text
              modifiers={[secondaryStyle, multilineTextAlignment("center")]}
            >
              Sign in to keep habits, streaks, and progress available across
              your devices. Your local habits stay here until you choose to
              sync.
            </Text>
          </VStack>
          <Button
            modifiers={[
              buttonStyle("borderedProminent"),
              controlSize("large"),
              tint(PlatformColor("label")),
            ]}
            onPress={openAuthView}
          >
            <HStack alignment="center" spacing={10}>
              <Spacer />
              <Text>Continue</Text>
              <Spacer />
            </HStack>
          </Button>
          <Spacer />
        </VStack>
      </Host>
      {authViewMounted ? (
        <View
          pointerEvents="none"
          style={{
            height: 0,
            overflow: "hidden",
            position: "absolute",
            width: 0,
          }}
        >
          <AuthView isDismissable key={authViewKey} mode="signInOrUp" />
        </View>
      ) : null}
    </>
  );
}
