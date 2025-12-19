import React, { useMemo } from "react";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Alert, Platform, PlatformColor } from "react-native";
import {
  getStreaks,
  getTodayString,
  useHabits,
} from "../../../components/habits-store";
import {
  Button,
  Host,
  HStack,
  Image,
  List,
  Section,
  Spacer,
  Text,
} from "@expo/ui/swift-ui";

export default function HabitDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { habits, renameHabit, deleteHabit, toggleCheckInToday } = useHabits();
  const habitId = Array.isArray(id) ? id[0] : id;
  const habit = useMemo(
    () => habits.find((item) => item.id === habitId),
    [habits, habitId]
  );

  if (!habit) {
    return (
      <>
        <Stack.Screen options={{ title: "Habit" }} />
        <Host matchContents useViewportSizeMeasurement style={{ flex: 1 }}>
          <List>
            <HStack>
              <Text>Not found</Text>
              <Spacer />
              <Text color="secondary">This habit no longer exists</Text>
            </HStack>
          </List>
        </Host>
      </>
    );
  }

  const today = getTodayString();
  const streaks = getStreaks(habit.checkins, today);
  const isCompletedToday = habit.checkins.includes(today);
  const totalCheckins = habit.checkins.length;
  const lastCheckin =
    totalCheckins > 0 ? habit.checkins.slice().sort().pop() : undefined;
  const handleRename = () => {
    if (Platform.OS === "ios" && "prompt" in Alert) {
      Alert.prompt(
        "Rename habit",
        "Update the habit name.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Save",
            onPress: async (value?: string) => {
              const trimmed = value?.trim();
              if (!trimmed || trimmed === habit.name) {
                return;
              }
              await renameHabit(habit.id, trimmed);
            },
          },
        ],
        "plain-text",
        habit.name,
        "Habit name"
      );
      return;
    }

    Alert.alert(
      "Rename habit",
      "Renaming currently requires iOS because native prompt alerts are not available on Android."
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete habit?",
      "This removes the habit and its streak history.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            router.back();
            await deleteHabit(habit.id);
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{ title: habit.name, headerBackButtonDisplayMode: "minimal" }}
      />
      <Host matchContents useViewportSizeMeasurement style={{ flex: 1 }}>
        <List>
          <Section title="Streaks">
            <HStack>
              <Text>Current</Text>
              <Spacer />
              <Text color="secondary">{`${streaks.current}`}</Text>
            </HStack>
            <HStack>
              <Text>Highest</Text>
              <Spacer />
              <Text color="secondary">{`${streaks.best}`}</Text>
            </HStack>
          </Section>
          <Section title="Progress">
            <HStack>
              <Text>Total check-ins</Text>
              <Spacer />
              <Text color="secondary">{`${totalCheckins}`}</Text>
            </HStack>
            <HStack>
              <Text>Last check-in</Text>
              <Spacer />
              <Text color="secondary">{lastCheckin ?? "Never"}</Text>
            </HStack>
          </Section>
          <Section title="Actions">
            <Button onPress={() => toggleCheckInToday(habit.id)}>
              <HStack>
                <Text color={PlatformColor("systemGreen") as unknown as string}>
                  {isCompletedToday ? "Mark as Incomplete" : "Mark as Complete"}
                </Text>
                <Spacer />
              </HStack>
            </Button>
            <Button onPress={handleRename}>
              <HStack>
                <Text color="primary">Rename habit</Text>
                <Spacer />
                <Image systemName="chevron.right" size={14} color="secondary" />
              </HStack>
            </Button>
            <Button onPress={handleDelete}>
              <HStack>
                <Text color="primary">Delete habit</Text>
                <Spacer />
                <Image systemName="chevron.right" size={14} color="secondary" />
              </HStack>
            </Button>
          </Section>
        </List>
      </Host>
    </>
  );
}
