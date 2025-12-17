import { Stack } from "expo-router";
import {
  Host,
  List,
  Section,
  Switch,
  Text,
  HStack,
  Spacer,
  Image,
} from "@expo/ui/swift-ui";
import { ScrollView } from "react-native";
import { useThemePreference } from "../theme-preference";

export default function SettingsScreen() {
  const { resolvedScheme } = useThemePreference();
  const isDark = resolvedScheme === "dark";

  return (
    <>
      <Stack.Screen options={{ title: "Settings" }} />
      <ScrollView>
        <Host
          matchContents
          useViewportSizeMeasurement
          colorScheme={isDark ? "dark" : "light"}
        >
          <List scrollEnabled={false}>
            <Section title="Credits">
              <Text color="secondary">Practice — Built by Praveen Juge</Text>
              <HStack>
                <Text>Privacy Policy</Text>
                <Spacer />
                <Image systemName="chevron.right" color="secondary" size={14} />
              </HStack>
            </Section>
          </List>
        </Host>
      </ScrollView>
    </>
  );
}
