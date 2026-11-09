import { Button, Host, Icon, List, ListItem } from "@expo/ui";
import { Stack } from "expo-router";
import { HabitStreakHistory } from "../../components/habit-streak-history";
import { APP_ACCENT_COLOR, HOST_THEME } from "../../lib/app-colors";
import {
  useHabitDetail,
  useHabitIdParam,
  useHabits,
} from "../../lib/habits-store";
import {
  CHECK_ICON,
  CIRCLE_ICON,
  DELETE_ICON,
  EDIT_ICON,
} from "../../lib/native-icons";
import { useHabitDetailActions } from "../../lib/screen-hooks";

const UNCHECKED_COLOR = "#8b949e";
const DANGER_COLOR = "#ef4444";

export default function HabitDetailsScreen() {
  const { today } = useHabits();
  const result = useHabitDetail(useHabitIdParam());
  const habit = result.status === "ready" ? result.detail : undefined;
  const { handleDelete, handleEdit, handleToggle } =
    useHabitDetailActions(habit);

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
