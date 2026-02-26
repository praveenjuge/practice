import React, { useMemo } from "react";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Alert } from "react-native";
import { APP_ACCENT_COLOR } from "../../../components/app-colors";
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
import { foregroundStyle, tint } from "@expo/ui/swift-ui/modifiers";

export default function HabitDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { habits, deleteHabit, toggleCheckInToday } = useHabits();
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
              <Text
                modifiers={[
                  foregroundStyle({
                    type: "hierarchical",
                    style: "secondary",
                  }),
                ]}
              >
                This habit no longer exists
              </Text>
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
  const showActionError = (title: string, error: unknown) => {
    Alert.alert(
      title,
      error instanceof Error ? error.message : "Please try again."
    );
  };

  const handleEdit = () => {
    router.push(`/habit/edit/${habit.id}`);
  };

  const handleToggle = () => {
    void toggleCheckInToday(habit.id).catch((error) => {
      showActionError("Unable to update habit", error);
    });
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
            try {
              await deleteHabit(habit.id);
              router.back();
            } catch (error) {
              showActionError("Unable to delete habit", error);
            }
          },
        },
      ]
    );
  };

  const secondaryStyle = foregroundStyle({
    type: "hierarchical",
    style: "secondary",
  });

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
              <Text modifiers={[secondaryStyle]}>{`${streaks.current}`}</Text>
            </HStack>
            <HStack>
              <Text>Highest</Text>
              <Spacer />
              <Text modifiers={[secondaryStyle]}>{`${streaks.best}`}</Text>
            </HStack>
          </Section>
          <Section title="Progress">
            <HStack>
              <Text>Total check-ins</Text>
              <Spacer />
              <Text modifiers={[secondaryStyle]}>{`${totalCheckins}`}</Text>
            </HStack>
            <HStack>
              <Text>Last check-in</Text>
              <Spacer />
              <Text modifiers={[secondaryStyle]}>
                {lastCheckin ?? "Never"}
              </Text>
            </HStack>
          </Section>
          <Section title="Actions">
            <Button
              onPress={handleToggle}
              modifiers={[tint(APP_ACCENT_COLOR)]}
            >
              <HStack>
                <Text modifiers={[foregroundStyle(APP_ACCENT_COLOR)]}>
                  {isCompletedToday ? "Mark as Incomplete" : "Mark as Complete"}
                </Text>
                <Spacer />
              </HStack>
            </Button>
            <Button onPress={handleEdit} modifiers={[tint(APP_ACCENT_COLOR)]}>
              <HStack>
                <Text modifiers={[foregroundStyle(APP_ACCENT_COLOR)]}>
                  Edit habit
                </Text>
                <Spacer />
                <Image systemName="chevron.right" size={14} color="secondary" />
              </HStack>
            </Button>
            <Button onPress={handleDelete}>
              <HStack>
                <Text
                  modifiers={[
                    foregroundStyle({
                      type: "hierarchical",
                      style: "primary",
                    }),
                  ]}
                >
                  Delete habit
                </Text>
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
