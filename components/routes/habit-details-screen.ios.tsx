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
import { useCallback } from "react";
import { Alert } from "react-native";
import { APP_ACCENT_COLOR, HOST_THEME } from "../app-colors";
import { HabitStreakHistory } from "../habit-streak-history";
import { useHabitDetail, useHabits } from "../habits-store";

const secondaryStyle = foregroundStyle({
  style: "secondary",
  type: "hierarchical",
});

const showActionError = (title: string, error: unknown) => {
  Alert.alert(
    title,
    error instanceof Error ? error.message : "Please try again."
  );
};

export default function HabitDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { deleteHabit, toggleCheckInToday } = useHabits();
  const habitId = Array.isArray(id) ? id[0] : id;
  const result = useHabitDetail(habitId);
  const habit = result.status === "ready" ? result.detail : undefined;

  const handleEdit = useCallback(() => {
    if (habit) {
      router.push(`/habit/edit/${habit.id}`);
    }
  }, [habit]);

  const handleToggle = useCallback(() => {
    if (!habit) {
      return;
    }
    if (!habit.checkedToday) {
      notificationAsync(NotificationFeedbackType.Success);
    }
    toggleCheckInToday(habit.id).catch((error: unknown) => {
      showActionError("Unable to update habit", error);
    });
  }, [habit, toggleCheckInToday]);

  const handleDelete = useCallback(() => {
    if (!habit) {
      return;
    }
    Alert.alert(
      "Delete habit?",
      "This removes the habit and its streak history.",
      [
        { style: "cancel", text: "Cancel" },
        {
          onPress: async () => {
            notificationAsync(NotificationFeedbackType.Warning);
            try {
              await deleteHabit(habit.id);
              router.back();
            } catch (error) {
              showActionError("Unable to delete habit", error);
            }
          },
          style: "destructive",
          text: "Delete",
        },
      ]
    );
  }, [deleteHabit, habit]);

  if (result.status === "loading") {
    return <Stack.Screen options={{ title: "" }} />;
  }

  if (!habit) {
    return (
      <>
        <Stack.Screen options={{ title: "Habit" }} />
        <Host {...HOST_THEME} style={{ flex: 1 }}>
          <List>
            <HStack>
              <Text>Not found</Text>
              <Spacer />
              <Text
                modifiers={[
                  foregroundStyle({
                    style: "secondary",
                    type: "hierarchical",
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

  const { checkedToday, history, stats } = habit;

  return (
    <>
      <Stack.Screen
        options={{ headerBackButtonDisplayMode: "minimal", title: habit.name }}
      />
      <Host {...HOST_THEME} style={{ flex: 1 }}>
        <List>
          <Section title="Streaks">
            <HStack>
              <Text>Current</Text>
              <Spacer />
              <Text
                modifiers={[secondaryStyle]}
              >{`${stats.currentStreak}`}</Text>
            </HStack>
            <HStack>
              <Text>Highest</Text>
              <Spacer />
              <Text modifiers={[secondaryStyle]}>{`${stats.bestStreak}`}</Text>
            </HStack>
          </Section>
          <Section title="Progress">
            <HStack>
              <Text>Total check-ins</Text>
              <Spacer />
              <Text
                modifiers={[secondaryStyle]}
              >{`${stats.totalCheckins}`}</Text>
            </HStack>
            <HStack>
              <Text>Last check-in</Text>
              <Spacer />
              <Text modifiers={[secondaryStyle]}>
                {stats.lastCheckin ?? "Never"}
              </Text>
            </HStack>
          </Section>
          <Section title="History">
            <HabitStreakHistory weeks={history} />
          </Section>
          <Section title="Actions">
            <Button modifiers={[tint(APP_ACCENT_COLOR)]} onPress={handleToggle}>
              <HStack>
                <Text>
                  {checkedToday ? "Mark as Incomplete" : "Mark as Complete"}
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
