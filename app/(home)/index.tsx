import {
  Button,
  ContextMenu,
  Host,
  HStack,
  Image,
  List,
  Section,
  Spacer,
  Text,
} from "@expo/ui/swift-ui";
import {
  buttonStyle,
  foregroundStyle,
  refreshable,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { APP_ACCENT_COLOR } from "../../components/app-colors";
import {
  getTodayString,
  hasCheckInToday,
  useHabits,
} from "../../components/habits-store";

export default function HomeScreen() {
  const {
    habits,
    isLoaded,
    isCloudAvailable,
    error,
    toggleCheckInToday,
    deleteHabit,
    reload,
  } = useHabits();
  const today = getTodayString();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHabits = searchQuery.trim()
    ? habits.filter((h) =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : habits;

  const handleAddOpen = () => {
    router.push("/habit/new");
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
      <Host matchContents style={{ flex: 1 }} useViewportSizeMeasurement>
        <List modifiers={[refreshable(handleRefresh)]}>
          {isCloudAvailable ? null : (
            <Section title="Sync">
              {error ? (
                <Text modifiers={[foregroundStyle("red")]}>{error}</Text>
              ) : (
                <Text>iCloud is unavailable on this device.</Text>
              )}
            </Section>
          )}
          <Section title="Your Habits">
            {isLoaded ? (
              filteredHabits.map((habit) => {
                const checkedToday = hasCheckInToday(habit.checkins, today);
                return (
                  <ContextMenu key={habit.id}>
                    <ContextMenu.Items>
                      <Button
                        label={
                          checkedToday ? "Mark Incomplete" : "Mark Complete"
                        }
                        onPress={() => handleToggle(habit.id)}
                        systemImage={
                          checkedToday ? "circle" : "checkmark.circle"
                        }
                      />
                      <Button
                        label="Delete"
                        onPress={() => handleDelete(habit.id, habit.name)}
                        systemImage="trash"
                      />
                    </ContextMenu.Items>
                    <ContextMenu.Trigger>
                      <Button
                        modifiers={[buttonStyle("plain")]}
                        onPress={() => router.push(`/habit/${habit.id}`)}
                      >
                        <HStack>
                          <HStack spacing={10}>
                            <Button onPress={() => handleToggle(habit.id)}>
                              <Image
                                color={
                                  checkedToday ? APP_ACCENT_COLOR : "secondary"
                                }
                                size={22}
                                systemName={
                                  checkedToday
                                    ? "checkmark.circle.fill"
                                    : "circle"
                                }
                              />
                            </Button>
                            <Text>{habit.name}</Text>
                          </HStack>
                          <Spacer />
                          <Image
                            color="secondary"
                            size={14}
                            systemName="chevron.right"
                          />
                        </HStack>
                      </Button>
                    </ContextMenu.Trigger>
                  </ContextMenu>
                );
              })
            ) : (
              <Text>Loading your habits...</Text>
            )}
            <Button onPress={handleAddOpen}>
              <HStack spacing={10}>
                <Image
                  color={APP_ACCENT_COLOR}
                  size={22}
                  systemName="plus.circle.fill"
                />
                <Text modifiers={[tint(APP_ACCENT_COLOR)]}>Add Habit</Text>
              </HStack>
            </Button>
          </Section>
        </List>
      </Host>
    </>
  );
}
