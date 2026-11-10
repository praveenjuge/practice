import { FieldGroup, Host, Icon, ListItem, Picker, Text } from "@expo/ui";
import { Stack } from "expo-router";
import { useState } from "react";
import { HabitStreakHistory } from "../../components/habit-streak-history";
import { APP_ACCENT_COLOR, HOST_THEME } from "../../lib/app-colors";
import { useHabitDetail, useHabitIdParam } from "../../lib/habits-store";
import {
  CHECK_ICON,
  CIRCLE_ICON,
  DELETE_ICON,
  EDIT_ICON,
} from "../../lib/native-icons";
import { useHabitDetailActions } from "../../lib/screen-hooks";
import { useConfirmDialog } from "../../lib/use-confirm-dialog";

// One screen for iOS and Android, built from universal @expo/ui components:
// a SwiftUI Form on iOS and Material 3 grouped lists on Android.

const SECONDARY = { color: "#8e8e93" };
const DANGER_COLOR = "#ff3b30";
const UNCHECKED_COLOR = "#8e8e93";

const HISTORY_RANGES = [
  { label: "Last 3 months", weeks: 13 },
  { label: "Last 6 months", weeks: 26 },
  { label: "Last year", weeks: 53 },
] as const;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <ListItem trailing={<Text textStyle={SECONDARY}>{value}</Text>}>
      {label}
    </ListItem>
  );
}

export default function HabitDetailsScreen() {
  const result = useHabitDetail(useHabitIdParam());
  const habit = result.status === "ready" ? result.detail : undefined;
  const { confirm, dialog } = useConfirmDialog();
  const { handleDelete, handleEdit, handleToggle } = useHabitDetailActions(
    habit,
    confirm
  );
  const [rangeWeeks, setRangeWeeks] = useState<number>(53);

  if (result.status === "loading") {
    return <Stack.Screen options={{ title: "" }} />;
  }

  if (!habit) {
    return (
      <>
        <Stack.Screen options={{ title: "Habit" }} />
        <Host {...HOST_THEME} style={{ flex: 1 }}>
          <FieldGroup>
            <FieldGroup.Section>
              <ListItem supportingText="This habit no longer exists.">
                Not found
              </ListItem>
            </FieldGroup.Section>
          </FieldGroup>
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
        <FieldGroup>
          <FieldGroup.Section title="Today">
            <ListItem
              leading={
                <Icon
                  color={checkedToday ? APP_ACCENT_COLOR : UNCHECKED_COLOR}
                  name={checkedToday ? CHECK_ICON : CIRCLE_ICON}
                  size={22}
                />
              }
              onPress={handleToggle}
            >
              {checkedToday ? "Checked in" : "Check in"}
            </ListItem>
          </FieldGroup.Section>
          <FieldGroup.Section title="Streaks">
            <Stat label="Current" value={`${stats.currentStreak}`} />
            <Stat label="Highest" value={`${stats.bestStreak}`} />
            <Stat label="Total check-ins" value={`${stats.totalCheckins}`} />
            <Stat label="Last check-in" value={stats.lastCheckin ?? "Never"} />
          </FieldGroup.Section>
          <FieldGroup.Section title="History">
            <Picker onValueChange={setRangeWeeks} selectedValue={rangeWeeks}>
              {HISTORY_RANGES.map((range) => (
                <Picker.Item
                  key={range.label}
                  label={range.label}
                  value={range.weeks}
                />
              ))}
            </Picker>
            <HabitStreakHistory weeks={history.slice(-rangeWeeks)} />
          </FieldGroup.Section>
          <FieldGroup.Section>
            <ListItem
              leading={
                <Icon color={APP_ACCENT_COLOR} name={EDIT_ICON} size={22} />
              }
              onPress={handleEdit}
            >
              Edit habit
            </ListItem>
            <ListItem
              leading={
                <Icon color={DANGER_COLOR} name={DELETE_ICON} size={22} />
              }
              onPress={handleDelete}
            >
              <Text textStyle={{ color: DANGER_COLOR }}>Delete habit</Text>
            </ListItem>
          </FieldGroup.Section>
        </FieldGroup>
      </Host>
      {dialog}
    </>
  );
}
