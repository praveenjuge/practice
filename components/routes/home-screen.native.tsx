import { Host, Icon, List, ListItem } from "@expo/ui";
import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { router, Stack } from "expo-router";
import { memo, useCallback, useState } from "react";
import { Alert } from "react-native";
import {
  ACCOUNT_MENU_ICON,
  ADD_TOOLBAR_ICON,
  useAccountActions,
} from "../account-actions";
import { APP_ACCENT_COLOR } from "../app-colors";
import { type Habit, useHabits } from "../habits-store";
import { ADD_ICON, CHECK_ICON, CIRCLE_ICON } from "../native-icons";
import { WeeklyStreakBoxes } from "../weekly-streak-boxes";

// Cross-platform home screen (Android); iOS uses home-screen.ios.tsx.

const UNCHECKED_COLOR = "#9aa0a6";
const openNewHabit = () => router.push("/habit/new");

interface HabitRowProps {
  habit: Habit;
  onToggle: (habit: Habit) => void;
}

const HabitRow = memo(function HabitRowContent({
  habit,
  onToggle,
}: HabitRowProps) {
  const { checkedToday } = habit;
  const handleOpen = useCallback(
    () => router.push(`/habit/${habit.id}`),
    [habit.id]
  );
  const handleToggle = useCallback(() => onToggle(habit), [habit, onToggle]);

  return (
    <ListItem
      leading={
        <Icon
          accessibilityLabel={
            checkedToday ? "Mark incomplete" : "Mark complete"
          }
          color={checkedToday ? APP_ACCENT_COLOR : UNCHECKED_COLOR}
          name={checkedToday ? CHECK_ICON : CIRCLE_ICON}
          onPress={handleToggle}
          size={24}
        />
      }
      onPress={handleOpen}
      supportingText={<WeeklyStreakBoxes days={habit.recentDays} />}
    >
      {habit.name}
    </ListItem>
  );
});

export default function HomeScreen() {
  const { habits, isLoaded, toggleCheckInToday } = useHabits();
  const { confirmDeleteAccount, confirmSignOut, email } = useAccountActions();
  const [searchQuery, setSearchQuery] = useState("");
  const trimmedSearchQuery = searchQuery.trim();
  const filteredHabits = trimmedSearchQuery
    ? habits.filter((habit) =>
        habit.name.toLowerCase().includes(trimmedSearchQuery.toLowerCase())
      )
    : habits;

  const handleToggle = useCallback(
    (habit: Habit) => {
      if (!habit.checkedToday) {
        notificationAsync(NotificationFeedbackType.Success);
      }
      toggleCheckInToday(habit.id).catch((error: unknown) => {
        Alert.alert(
          "Unable to update habit",
          error instanceof Error ? error.message : "Please try again."
        );
      });
    },
    [toggleCheckInToday]
  );

  const handleSearch = useCallback(
    (event: { nativeEvent: { text: string } }) =>
      setSearchQuery(event.nativeEvent.text),
    []
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            onChangeText: handleSearch,
            placeholder: "Search habits",
          },
          headerShown: true,
          title: "Practice",
        }}
      />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          accessibilityLabel="New habit"
          icon={ADD_TOOLBAR_ICON}
          onPress={openNewHabit}
        />
        <Stack.Toolbar.Menu
          accessibilityLabel="Account"
          icon={ACCOUNT_MENU_ICON}
          title={email}
        >
          <Stack.Toolbar.MenuAction onPress={confirmSignOut}>
            Sign Out
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction destructive onPress={confirmDeleteAccount}>
            Delete Account
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      <Host style={{ flex: 1 }}>
        <List>
          {isLoaded && filteredHabits.length === 0 ? (
            <ListItem
              leading={
                <Icon color={APP_ACCENT_COLOR} name={ADD_ICON} size={24} />
              }
              onPress={openNewHabit}
              supportingText={
                trimmedSearchQuery
                  ? `No habit matches "${trimmedSearchQuery}".`
                  : "Add your first habit."
              }
            >
              No habits
            </ListItem>
          ) : null}
          {filteredHabits.map((habit) => (
            <HabitRow habit={habit} key={habit.id} onToggle={handleToggle} />
          ))}
        </List>
      </Host>
    </>
  );
}
