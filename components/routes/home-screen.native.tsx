import { UserButton } from "@clerk/expo/native";
import { Host, Icon, List, ListItem } from "@expo/ui";
import { foregroundStyle } from "@expo/ui/swift-ui/modifiers";
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
              <ListItem
                key={habit.id}
                leading={
                  <Icon
                    accessibilityLabel={
                      checkedToday ? "Mark incomplete" : "Mark complete"
                    }
                    color={checkedToday ? APP_ACCENT_COLOR : "#c7c7cc"}
                    modifiers={[
                      foregroundStyle(
                        checkedToday ? APP_ACCENT_COLOR : "#c7c7cc"
                      ),
                    ]}
                    name={checkedToday ? CHECK_ICON : CIRCLE_ICON}
                    onPress={() => handleToggle(habit.id)}
                    size={32}
                  />
                }
                onPress={() => router.push(`/habit/${habit.id}`)}
                supportingText={
                  <WeeklyStreakBoxes
                    days={getRollingWeekCheckins(habit.checkins, today, 30)}
                  />
                }
              >
                {habit.name}
              </ListItem>
            );
          })}
        </List>
      </Host>
    </>
  );
}
