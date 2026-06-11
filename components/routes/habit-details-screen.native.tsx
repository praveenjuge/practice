import { Button, Host, Icon, List, ListItem } from "@expo/ui";
import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Alert } from "react-native";
import { APP_ACCENT_COLOR } from "../app-colors";
import { HabitStreakHistory } from "../habit-streak-history";
import { getYearHabitHistory, useHabits } from "../habits-store";
import {
  CHECK_ICON,
  CIRCLE_ICON,
  DELETE_ICON,
  EDIT_ICON,
} from "../native-icons";

export default function HabitDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { habits, deleteHabit, today, toggleCheckInToday } = useHabits();
  const habitId = Array.isArray(id) ? id[0] : id;
  const habit = useMemo(
    () => habits.find((item) => item.id === habitId),
    [habits, habitId]
  );
  const historyWeeks = useMemo(
    () => getYearHabitHistory(habit?.checkins ?? [], today),
    [habit?.checkins, today]
  );

  if (!habit) {
    return (
      <>
        <Stack.Screen options={{ title: "Habit" }} />
        <Host style={{ flex: 1 }}>
          <List>
            <ListItem supportingText="This habit no longer exists.">
              Not found
            </ListItem>
          </List>
        </Host>
      </>
    );
  }

  const streaks = habit.stats;
  const isCompletedToday = habit.checkins.includes(today);
  const totalCheckins = habit.stats.totalCheckins;
  const lastCheckin = habit.stats.lastCheckin ?? undefined;

  const showActionError = (title: string, err: unknown) => {
    Alert.alert(
      title,
      err instanceof Error ? err.message : "Please try again."
    );
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
        { style: "cancel", text: "Cancel" },
        {
          onPress: async () => {
            notificationAsync(NotificationFeedbackType.Warning);
            try {
              await deleteHabit(habit.id);
              router.back();
            } catch (err) {
              showActionError("Unable to delete habit", err);
            }
          },
          style: "destructive",
          text: "Delete",
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{ headerBackButtonDisplayMode: "minimal", title: habit.name }}
      />
      <Host style={{ flex: 1 }}>
        <List>
          <ListItem supportingText={`${streaks.currentStreak}`}>
            Current streak
          </ListItem>
          <ListItem supportingText={`${streaks.bestStreak}`}>
            Highest streak
          </ListItem>
          <ListItem supportingText={`${totalCheckins}`}>
            Total check-ins
          </ListItem>
          <ListItem supportingText={lastCheckin ?? "Never"}>
            Last check-in
          </ListItem>
          <ListItem
            supportingText={<HabitStreakHistory weeks={historyWeeks} />}
          >
            History
          </ListItem>
          <ListItem>
            <Button
              label={isCompletedToday ? "Mark Incomplete" : "Mark Complete"}
              onPress={handleToggle}
              variant="filled"
            />
          </ListItem>
          <ListItem
            leading={
              <Icon
                color={isCompletedToday ? APP_ACCENT_COLOR : "#8b949e"}
                name={isCompletedToday ? CHECK_ICON : CIRCLE_ICON}
                size={22}
              />
            }
            onPress={handleToggle}
            supportingText={today}
          >
            Today
          </ListItem>
          <ListItem
            leading={
              <Icon color={APP_ACCENT_COLOR} name={EDIT_ICON} size={22} />
            }
            onPress={() => router.push(`/habit/edit/${habit.id}`)}
          >
            Edit habit
          </ListItem>
          <ListItem
            leading={<Icon color="#ef4444" name={DELETE_ICON} size={22} />}
            onPress={handleDelete}
          >
            Delete habit
          </ListItem>
        </List>
      </Host>
    </>
  );
}
