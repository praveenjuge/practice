import React from "react";
import { Stack, router } from "expo-router";
import { Platform, Alert, Button, PlatformColor } from "react-native";
import {
  useHabits,
  getTodayString,
  hasCheckInToday,
} from "../../components/habits-store";
import {
  Host,
  HStack,
  List,
  Section,
  Spacer,
  Text,
  Image,
  Button as SFButton,
} from "@expo/ui/swift-ui";

export default function HomeScreen() {
  const { habits, isLoaded, isCloudAvailable, error, checkInToday, addHabit } =
    useHabits();
  const today = getTodayString();

  const handleAddOpen = () => {
    if (Platform.OS === "ios" && "prompt" in Alert) {
      Alert.prompt(
        "New habit",
        "Give it a name to start tracking.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add",
            onPress: async (value?: string) => {
              const trimmed = value?.trim();
              if (!trimmed) {
                return;
              }
              await addHabit(trimmed);
            },
          },
        ],
        "plain-text",
        "",
        "Habit name"
      );
      return;
    }

    Alert.alert(
      "New habit",
      "Adding a habit currently requires iOS because native prompt alerts are not available on Android."
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Practice",
          headerLargeTitleEnabled: true,
          headerRight: () => (
            <Button color="primary" title="Add" onPress={handleAddOpen} />
          ),
        }}
      />
      <Host matchContents useViewportSizeMeasurement style={{ flex: 1 }}>
        <List>
          {!isCloudAvailable ? (
            <Section title="Sync">
              <Text>iCloud is unavailable on this device.</Text>
              {error ? <Text color="red">{error}</Text> : null}
            </Section>
          ) : null}
          <Section title="Your Habits">
            {!isLoaded ? (
              <Text>Loading your habits...</Text>
            ) : habits.length === 0 ? (
              <Text>No habits yet. Start one.</Text>
            ) : (
              habits.map((habit) => {
                const checkedToday = hasCheckInToday(habit.checkins, today);
                return (
                  <SFButton
                    key={habit.id}
                    onPress={() => router.push(`/habit/${habit.id}`)}
                  >
                    <HStack>
                      <HStack spacing={10}>
                        <SFButton
                          onPress={() => {
                            void checkInToday(habit.id);
                          }}
                        >
                          <Image
                            size={22}
                            systemName={
                              checkedToday ? "checkmark.circle.fill" : "circle"
                            }
                            color={
                              checkedToday
                                ? (PlatformColor(
                                    "systemGreen"
                                  ) as unknown as string)
                                : "secondary"
                            }
                          />
                        </SFButton>
                        <Text color="primary">{habit.name}</Text>
                      </HStack>
                      <Spacer />
                      <Image
                        systemName="chevron.right"
                        size={14}
                        color="secondary"
                      />
                    </HStack>
                  </SFButton>
                );
              })
            )}
          </Section>
        </List>
      </Host>
    </>
  );
}
