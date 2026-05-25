import { Stack } from "expo-router";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: !isWeb,
        headerLargeTitle: true,
        headerLargeTitleShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Practice" }} />
      <Stack.Screen
        name="habit/new"
        options={{
          ...(isWeb
            ? {}
            : {
                presentation: "formSheet",
                sheetGrabberVisible: true,
                sheetAllowedDetents: [0.5, 1.0],
              }),
        }}
      />
      <Stack.Screen
        name="habit/edit/[id]"
        options={{
          ...(isWeb
            ? {}
            : {
                presentation: "formSheet",
                sheetGrabberVisible: true,
                sheetAllowedDetents: [0.5, 1.0],
              }),
        }}
      />
    </Stack>
  );
}
