import { Host, Icon, List, ListItem } from "@expo/ui";
import { Button, HStack, Text, VStack } from "@expo/ui/swift-ui";
import {
  buttonStyle,
  contentShape,
  foregroundStyle,
  frame,
  layoutPriority,
  shapes,
} from "@expo/ui/swift-ui/modifiers";
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

const UNCHECKED_COLOR = "#c7c7cc";
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
  const iconColor = checkedToday ? APP_ACCENT_COLOR : UNCHECKED_COLOR;
  const handleOpen = useCallback(
    () => router.push(`/habit/${habit.id}`),
    [habit.id]
  );
  const handleToggle = useCallback(() => onToggle(habit), [habit, onToggle]);

  return (
    <Button modifiers={[buttonStyle("plain")]} onPress={handleOpen}>
      <HStack
        alignment="center"
        modifiers={[
          contentShape(shapes.rectangle()),
          frame({ maxWidth: Number.POSITIVE_INFINITY }),
        ]}
        spacing={12}
      >
        <Icon
          accessibilityLabel={
            checkedToday ? "Mark incomplete" : "Mark complete"
          }
          color={iconColor}
          modifiers={[foregroundStyle(iconColor)]}
          name={checkedToday ? CHECK_ICON : CIRCLE_ICON}
          onPress={handleToggle}
          size={22}
        />
        <VStack
          alignment="leading"
          modifiers={[
            frame({ maxWidth: Number.POSITIVE_INFINITY }),
            layoutPriority(1),
          ]}
          spacing={2}
        >
          <Text>{habit.name}</Text>
          <WeeklyStreakBoxes days={habit.recentDays} />
        </VStack>
      </HStack>
    </Button>
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
            hideWhenScrolling: true,
            onChangeText: handleSearch,
            placeholder: "Search habits",
          },
          headerShown: true,
          title: "Practice",
        }}
      />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu
          accessibilityLabel="Account"
          icon={ACCOUNT_MENU_ICON}
          title={email}
        >
          <Stack.Toolbar.MenuAction
            icon="rectangle.portrait.and.arrow.right"
            onPress={confirmSignOut}
          >
            Sign Out
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction
            destructive
            icon="trash"
            onPress={confirmDeleteAccount}
          >
            Delete Account
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
        <Stack.Toolbar.Button
          accessibilityLabel="New habit"
          icon={ADD_TOOLBAR_ICON}
          onPress={openNewHabit}
        />
      </Stack.Toolbar>
      <Host style={{ flex: 1 }}>
        <List>
          {isLoaded && filteredHabits.length === 0 ? (
            <ListItem
              leading={
                <Icon color={APP_ACCENT_COLOR} name={ADD_ICON} size={22} />
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
