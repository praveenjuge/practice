import { UserButton } from "@clerk/expo/native";
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
import { useState } from "react";
import { Alert, View } from "react-native";
import { APP_ACCENT_COLOR } from "../app-colors";
import {
  getRollingWeekCheckins,
  hasCheckInToday,
  useHabits,
} from "../habits-store";
import { ADD_ICON, CHECK_ICON, CIRCLE_ICON } from "../native-icons";
import { WeeklyStreakBoxes } from "../weekly-streak-boxes";

interface HabitRowProps {
  checkedToday: boolean;
  name: string;
  onOpen: () => void;
  onToggle: () => void;
  streakDays: ReturnType<typeof getRollingWeekCheckins>;
}

function HabitRow({
  checkedToday,
  name,
  onOpen,
  onToggle,
  streakDays,
}: HabitRowProps) {
  const iconColor = checkedToday ? APP_ACCENT_COLOR : "#c7c7cc";

  return (
    <Button modifiers={[buttonStyle("plain")]} onPress={onOpen}>
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
          onPress={onToggle}
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
          <Text>{name}</Text>
          <WeeklyStreakBoxes days={streakDays} />
        </VStack>
      </HStack>
    </Button>
  );
}

export default function HomeScreen() {
  const { habits, isLoaded, today, toggleCheckInToday } = useHabits();
  const [searchQuery, setSearchQuery] = useState("");
  const trimmedSearchQuery = searchQuery.trim();
  const filteredHabits = trimmedSearchQuery
    ? habits.filter((habit) =>
        habit.name.toLowerCase().includes(trimmedSearchQuery.toLowerCase())
      )
    : habits;

  const showActionError = (title: string, err: unknown) => {
    Alert.alert(
      title,
      err instanceof Error ? err.message : "Please try again."
    );
  };

  const handleToggle = (habitId: string) => {
    const habit = habits.find((item) => item.id === habitId);
    const willCheckIn = !hasCheckInToday(habit?.checkins ?? [], today);
    if (willCheckIn) {
      notificationAsync(NotificationFeedbackType.Success);
    }
    toggleCheckInToday(habitId).catch((err) => {
      showActionError("Unable to update habit", err);
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Practice",
          headerSearchBarOptions: {
            hideWhenScrolling: true,
            placeholder: "Search habits",
            onChangeText: (event) => setSearchQuery(event.nativeEvent.text),
          },
        }}
      />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.View>
          <View
            style={{
              borderRadius: 14,
              height: 28,
              overflow: "hidden",
              width: 28,
            }}
          >
            <UserButton />
          </View>
        </Stack.Toolbar.View>
        <Stack.Toolbar.Button
          icon="plus"
          onPress={() => router.push("/habit/new")}
        />
      </Stack.Toolbar>
      <Host style={{ flex: 1 }}>
        <List>
          {isLoaded && filteredHabits.length === 0 ? (
            <ListItem
              leading={
                <Icon color={APP_ACCENT_COLOR} name={ADD_ICON} size={22} />
              }
              onPress={() => router.push("/habit/new")}
              supportingText={
                trimmedSearchQuery
                  ? `No habit matches "${trimmedSearchQuery}".`
                  : "Add your first habit."
              }
            >
              No habits
            </ListItem>
          ) : null}
          {filteredHabits.map((habit) => {
            const checkedToday = hasCheckInToday(habit.checkins, today);
            return (
              <HabitRow
                checkedToday={checkedToday}
                key={habit.id}
                name={habit.name}
                onOpen={() => router.push(`/habit/${habit.id}`)}
                onToggle={() => handleToggle(habit.id)}
                streakDays={getRollingWeekCheckins(habit.checkins, today, 30)}
              />
            );
          })}
        </List>
      </Host>
    </>
  );
}
