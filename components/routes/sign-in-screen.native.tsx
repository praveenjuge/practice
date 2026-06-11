import { AuthView } from "@clerk/expo/native";
import { Stack } from "expo-router";
import { View } from "react-native";

export default function SignInScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false, title: "Sign in" }} />
      <View style={{ flex: 1 }}>
        <AuthView mode="signInOrUp" />
      </View>
    </>
  );
}
