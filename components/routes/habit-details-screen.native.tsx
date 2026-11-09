import { Button, Host, Icon, List, ListItem } from "@expo/ui";
import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { Alert } from "react-native";
import { APP_ACCENT_COLOR, HOST_THEME } from "../app-colors";
import { HabitStreakHistory } from "../habit-streak-history";
import { useHabitDetail, useHabits } from "../habits-store";
import {
  CHECK_ICON,
  CIRCLE_ICON,
  DELETE_ICON,
  EDIT_ICON,
} from "../native-icons";

const UNCHECKED_COLOR = "#8b949e";
const DANGER_COLOR = "#ef4444";

const showActionError = (title: string, error: unknown) => {
  Alert.alert(
    title,
    error instanceof Error ? error.message : "Please try again."
  );
};

export default function HabitDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { deleteHabit, today, toggleCheckInToday } = useHabits();
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
            <ListItem supportingText="This habit no longer exists.">
              Not found
            </ListItem>
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
          <ListItem supportingText={`${stats.currentStreak}`}>
            Current streak
          </ListItem>
          <ListItem supportingText={`${stats.bestStreak}`}>
            Highest streak
          </ListItem>
          <ListItem supportingText={`${stats.totalCheckins}`}>
            Total check-ins
          </ListItem>
          <ListItem supportingText={stats.lastCheckin ?? "Never"}>
            Last check-in
          </ListItem>
          <ListItem supportingText={<HabitStreakHistory weeks={history} />}>
            History
          </ListItem>
          <ListItem>
            <Button
              label={checkedToday ? "Mark Incomplete" : "Mark Complete"}
              onPress={handleToggle}
              variant="filled"
            />
          </ListItem>
          <ListItem
            leading={
              <Icon
                color={checkedToday ? APP_ACCENT_COLOR : UNCHECKED_COLOR}
                name={checkedToday ? CHECK_ICON : CIRCLE_ICON}
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
            onPress={handleEdit}
          >
            Edit habit
          </ListItem>
          <ListItem
            leading={<Icon color={DANGER_COLOR} name={DELETE_ICON} size={22} />}
            onPress={handleDelete}
          >
            Delete habit
          </ListItem>
        </List>
      </Host>
    </>
  );
}
