import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: Platform.OS !== "web" }}>
      <Stack.Screen name="sign-in" />
    </Stack>
  );
}
