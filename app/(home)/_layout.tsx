import { Stack } from "expo-router";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

export default function Layout() {
  return (
    <Stack
      // React Activity: a screen with two or more screens above it is hidden
      // (state kept, effects paused) so it stops re-rendering off screen.
      activityEnabled={2}
      screenOptions={{
        headerLargeTitle: true,
        headerLargeTitleShadowVisible: false,
        headerShown: !isWeb,
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
                sheetAllowedDetents: [0.5, 1.0],
                sheetGrabberVisible: true,
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
                sheetAllowedDetents: [0.5, 1.0],
                sheetGrabberVisible: true,
              }),
        }}
      />
    </Stack>
  );
}
