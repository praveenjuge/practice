import { useAuth } from "@clerk/expo";
import { AuthView } from "@clerk/expo/native";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { PlatformColor, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SignInScreen() {
  const { isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  const insets = useSafeAreaInsets();
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

  return (
    <>
      <Stack.Screen options={{ title: "Login" }} />
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 28,
        }}
      >
        <View style={{ gap: 10, marginBottom: 28 }}>
          <Text
            style={{
              color: PlatformColor("label"),
              fontSize: 28,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            Sync your practice
          </Text>
          <Text
            style={{
              color: PlatformColor("secondaryLabel"),
              fontSize: 17,
              lineHeight: 23,
              textAlign: "center",
            }}
          >
            Sign in to keep habits, streaks, and progress available across your
            devices.
          </Text>
        </View>
        <View style={{ gap: 10, marginBottom: 24 }}>
          <Text
            style={{
              color: PlatformColor("secondaryLabel"),
              textAlign: "center",
            }}
          >
            Your local habits stay here until you choose to sync.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={openAuthView}
          style={{
            alignItems: "center",
            backgroundColor: PlatformColor("label"),
            borderRadius: 10,
            minHeight: 52,
            justifyContent: "center",
            paddingHorizontal: 20,
          }}
        >
          <Text
            style={{
              color: PlatformColor("systemBackground"),
              fontSize: 17,
              fontWeight: "600",
            }}
          >
            Continue
          </Text>
        </Pressable>
        {authViewMounted ? (
          <View
            pointerEvents="none"
            style={{ height: 0, overflow: "hidden", width: 0 }}
          >
            <AuthView isDismissable key={authViewKey} mode="signInOrUp" />
          </View>
        ) : null}
      </View>
    </>
  );
}
