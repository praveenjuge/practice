import { useAuth } from "@clerk/expo";
import { UserButton } from "@clerk/expo/native";
import AddToolbarIcon from "@expo/material-symbols/add.xml";
import { Host, Icon, List, ListItem } from "@expo/ui";
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
import {
  ADD_ICON,
  CHECK_ICON,
  CHEVRON_RIGHT_ICON,
  CIRCLE_ICON,
  SYNC_ICON,
  WARNING_ICON,
} from "../native-icons";
import { WeeklyStreakBoxes } from "../weekly-streak-boxes";
import { NativeAuthEntry } from "./native-auth-entry";

export default function HomeScreen() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  if (!(authLoaded && isSignedIn)) {
    return <NativeAuthEntry />;
  }

  return <SignedInHomeScreen />;
}

function SignedInHomeScreen() {
  const {
    habits,
    isLoaded,
    error,
    syncState,
    today,
    toggleCheckInToday,
    reload,
  } = useHabits();
  const [searchQuery, setSearchQuery] = useState("");
  const isOnline = syncState === "online";
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
    if (!isOnline) {
      Alert.alert("Offline", "Reconnect before changing habits.");
      return;
    }
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
          disabled={!isOnline}
          icon={AddToolbarIcon}
          iconRenderingMode="template"
          onPress={() => router.push("/habit/new")}
        />
      </Stack.Toolbar>
      <Host style={{ flex: 1 }}>
        <List onRefresh={reload}>
          {syncState === "online" ? null : (
            <ListItem
              leading={<Icon color="#f59e0b" name={SYNC_ICON} size={22} />}
              supportingText="Your current list is read-only until Convex reconnects."
            >
              Offline
            </ListItem>
          )}
          {error ? (
            <ListItem
              leading={<Icon color="#ef4444" name={WARNING_ICON} size={22} />}
              supportingText={error}
            >
              Storage
            </ListItem>
          ) : null}
          {isLoaded && filteredHabits.length === 0 ? (
            <ListItem
              leading={
                <Icon color={APP_ACCENT_COLOR} name={ADD_ICON} size={22} />
              }
              onPress={() => router.push("/habit/new")}
              supportingText={
                trimmedSearchQuery
                  ? `No habit matches "${trimmedSearchQuery}".`
                  : "Add your first Convex-backed habit."
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
                    color={checkedToday ? APP_ACCENT_COLOR : "#8b949e"}
                    name={checkedToday ? CHECK_ICON : CIRCLE_ICON}
                    onPress={() => handleToggle(habit.id)}
                    size={24}
                  />
                }
                onPress={() => router.push(`/habit/${habit.id}`)}
                supportingText={
                  <WeeklyStreakBoxes
                    days={getRollingWeekCheckins(habit.checkins, today, 30)}
                    onPress={() => router.push(`/habit/${habit.id}`)}
                  />
                }
                trailing={
                  <Icon color="#8b949e" name={CHEVRON_RIGHT_ICON} size={18} />
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
