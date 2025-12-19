import React from "react";
import { Stack, router } from "expo-router";
import { Platform, Alert, PlatformColor } from "react-native";
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
  Button,
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
            ) : (
              habits.map((habit) => {
                const checkedToday = hasCheckInToday(habit.checkins, today);
                return (
                  <Button
                    key={habit.id}
                    onPress={() => router.push(`/habit/${habit.id}`)}
                  >
                    <HStack>
                      <HStack spacing={10}>
                        <Button
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
                        </Button>
                        <Text color="primary">{habit.name}</Text>
                      </HStack>
                      <Spacer />
                      <Image
                        systemName="chevron.right"
                        size={14}
                        color="secondary"
                      />
                    </HStack>
                  </Button>
                );
              })
            )}
            <Button onPress={handleAddOpen}>
              <HStack spacing={10}>
                <Image
                  systemName="plus.circle.fill"
                  color={PlatformColor("systemGreen") as unknown as string}
                  size={22}
                />
                <Text color={PlatformColor("systemGreen") as unknown as string}>
                  Add Habit
                </Text>
              </HStack>
            </Button>
          </Section>
        </List>
      </Host>
    </>
  );
}
