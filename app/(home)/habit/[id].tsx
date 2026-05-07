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
import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Alert } from "react-native";
import { APP_ACCENT_COLOR } from "../../../components/app-colors";
import { HabitStreakHistory } from "../../../components/habit-streak-history";
import {
  getStreaks,
  getTodayString,
  getYearHabitHistory,
  useHabits,
} from "../../../components/habits-store";

export default function HabitDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { habits, deleteHabit, toggleCheckInToday } = useHabits();
  const habitId = Array.isArray(id) ? id[0] : id;
  const habit = useMemo(
    () => habits.find((item) => item.id === habitId),
    [habits, habitId]
  );
  const today = getTodayString();
  const historyWeeks = useMemo(
    () => getYearHabitHistory(habit?.checkins ?? [], today),
    [habit?.checkins, today]
  );

  if (!habit) {
    return (
      <>
        <Stack.Screen options={{ title: "Habit" }} />
        <Host matchContents style={{ flex: 1 }} useViewportSizeMeasurement>
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
    if (!isCompletedToday) {
      notificationAsync(NotificationFeedbackType.Success);
    }
    toggleCheckInToday(habit.id).catch((err) => {
      showActionError("Unable to update habit", err);
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
            notificationAsync(NotificationFeedbackType.Warning);
            try {
              await deleteHabit(habit.id);
              router.back();
            } catch (err) {
              showActionError("Unable to delete habit", err);
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
      <Host matchContents style={{ flex: 1 }} useViewportSizeMeasurement>
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
              <Text modifiers={[secondaryStyle]}>{lastCheckin ?? "Never"}</Text>
            </HStack>
          </Section>
          <Section title="History">
            <HabitStreakHistory weeks={historyWeeks} />
          </Section>
          <Section title="Actions">
            <Button modifiers={[tint(APP_ACCENT_COLOR)]} onPress={handleToggle}>
              <HStack>
                <Text>
                  {isCompletedToday ? "Mark as Incomplete" : "Mark as Complete"}
                </Text>
                <Spacer />
              </HStack>
            </Button>
            <Button modifiers={[tint(APP_ACCENT_COLOR)]} onPress={handleEdit}>
              <HStack>
                <Text>Edit habit</Text>
                <Spacer />
                <Image color="secondary" size={14} systemName="chevron.right" />
              </HStack>
            </Button>
            {/** biome-ignore lint/a11y/useValidAriaRole: <this is swift> */}
            <Button onPress={handleDelete} role="destructive">
              <HStack>
                <Text>Delete habit</Text>
                <Spacer />
                <Image color="secondary" size={14} systemName="chevron.right" />
              </HStack>
            </Button>
          </Section>
        </List>
      </Host>
    </>
  );
}
