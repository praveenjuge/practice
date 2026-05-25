import { useAuth } from "@clerk/expo";
import { UserButton } from "@clerk/expo/native";
import {
  Button,
  ContentUnavailableView,
  ContextMenu,
  Host,
  HStack,
  Image,
  List,
  Section,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  foregroundStyle,
  refreshable,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Alert, PlatformColor, View } from "react-native";
import { APP_ACCENT_COLOR } from "../app-colors";
import {
  getRollingWeekCheckins,
  hasCheckInToday,
  useHabits,
} from "../habits-store";
import { WeeklyStreakBoxes } from "../weekly-streak-boxes";

export default function HomeScreen() {
  const {
    habits,
    isLoaded,
    error,
    authPromptVisible,
    mode,
    syncState,
    today,
    toggleCheckInToday,
    deleteHabit,
    reload,
  } = useHabits();
  const { isSignedIn } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const trimmedSearchQuery = searchQuery.trim();
  const hasSearchQuery = trimmedSearchQuery.length > 0;

  const filteredHabits = hasSearchQuery
    ? habits.filter((h) =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : habits;

  const handleOpenNewHabit = () => {
    router.push("/habit/new");
  };

  const handleOpenSignIn = () => {
    router.push("/sign-in");
  };

  const showActionError = (title: string, error: unknown) => {
    Alert.alert(
      title,
      error instanceof Error ? error.message : "Please try again."
    );
  };

  const handleToggle = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    const willCheckIn = !hasCheckInToday(habit?.checkins ?? [], today);
    if (willCheckIn) {
      notificationAsync(NotificationFeedbackType.Success);
    }
    toggleCheckInToday(habitId).catch((err) => {
      showActionError("Unable to update habit", err);
    });
  };

  const handleDelete = (habitId: string, habitName: string) => {
    Alert.alert(
      "Delete habit?",
      `This will remove "${habitName}" and all of its check-ins.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            notificationAsync(NotificationFeedbackType.Warning);
            deleteHabit(habitId).catch((err) => {
              showActionError("Unable to delete habit", err);
            });
          },
        },
      ]
    );
  };

  const handleRefresh = async () => {
    await reload();
  };

  const renderHabitsSectionContent = () => {
    if (!isLoaded) {
      return <Text>Loading your habits...</Text>;
    }

    if (filteredHabits.length === 0) {
      if (hasSearchQuery) {
        return (
          <ContentUnavailableView
            description={`No habit matches "${trimmedSearchQuery}".`}
            systemImage="magnifyingglass"
            title="No Matching Habits"
          />
        );
      }

      return (
        <ContentUnavailableView
          description="Build momentum with one small daily habit. Tap + to add your first one."
          systemImage="checkmark.circle"
          title="No Habits Yet"
        />
      );
    }

    return filteredHabits.map((habit) => {
      const checkedToday = hasCheckInToday(habit.checkins, today);
      const weekDays = getRollingWeekCheckins(habit.checkins, today, 30);
      const openHabitDetail = () => router.push(`/habit/${habit.id}`);
      return (
        <ContextMenu key={habit.id}>
          <ContextMenu.Items>
            <Button
              label={checkedToday ? "Mark Incomplete" : "Mark Complete"}
              onPress={() => handleToggle(habit.id)}
              systemImage={checkedToday ? "circle" : "checkmark.circle"}
            />
            <Button
              label="Delete"
              onPress={() => handleDelete(habit.id, habit.name)}
              systemImage="trash"
            />
          </ContextMenu.Items>
          <ContextMenu.Trigger>
            <Button
              modifiers={[tint(PlatformColor("label"))]}
              onPress={openHabitDetail}
            >
              <HStack spacing={10}>
                <Button onPress={() => handleToggle(habit.id)}>
                  <Image
                    color={checkedToday ? APP_ACCENT_COLOR : "secondary"}
                    size={22}
                    systemName={
                      checkedToday ? "checkmark.circle.fill" : "circle"
                    }
                  />
                </Button>
                <VStack alignment="leading" spacing={6}>
                  <Text>{habit.name}</Text>
                  <WeeklyStreakBoxes
                    days={weekDays}
                    onPress={openHabitDetail}
                  />
                </VStack>
              </HStack>
            </Button>
          </ContextMenu.Trigger>
        </ContextMenu>
      );
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Practice",
          headerSearchBarOptions: {
            hideWhenScrolling: true,
            placeholder: "Search habits",
            onChangeText: (e) => setSearchQuery(e.nativeEvent.text),
          },
        }}
      />
      <Stack.Toolbar placement="right">
        {isSignedIn ? (
          <Stack.Toolbar.View>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              <UserButton />
            </View>
          </Stack.Toolbar.View>
        ) : null}
        <Stack.Toolbar.Button icon="plus" onPress={handleOpenNewHabit} />
      </Stack.Toolbar>
      <Host style={{ flex: 1 }}>
        <List modifiers={[refreshable(handleRefresh)]}>
          {authPromptVisible ? (
            <Section title="Sync Online">
              <Text>Local habits stay on this device.</Text>
              <Button
                modifiers={[tint(APP_ACCENT_COLOR)]}
                onPress={handleOpenSignIn}
              >
                <Text>Create account to sync</Text>
              </Button>
            </Section>
          ) : null}
          {mode === "signedIn" && syncState !== "online" ? (
            <Section title="Sync">
              <Text>
                {syncState === "claiming"
                  ? "Moving your local habits online..."
                  : "Unable to reach online storage."}
              </Text>
              {syncState === "offline" ? (
                <Button modifiers={[tint(APP_ACCENT_COLOR)]} onPress={reload}>
                  <Text>Retry</Text>
                </Button>
              ) : null}
            </Section>
          ) : null}
          {error ? (
            <Section title="Storage">
              <Text modifiers={[foregroundStyle("red")]}>{error}</Text>
            </Section>
          ) : null}
          <Section title="Your Habits">{renderHabitsSectionContent()}</Section>
        </List>
      </Host>
    </>
  );
}
