import React from "react";
import { Stack, router } from "expo-router";
import { Alert } from "react-native";
import { APP_ACCENT_COLOR } from "../../components/app-colors";
import {
  useHabits,
  getTodayString,
  hasCheckInToday,
} from "../../components/habits-store";
import {
  Host,
  HStack,
  List,
  Section,
  Spacer,
  Text,
  Image,
  Button,
  ContextMenu,
} from "@expo/ui/swift-ui";

export default function HomeScreen() {
  const {
    habits,
    isLoaded,
    isCloudAvailable,
    error,
    toggleCheckInToday,
    deleteHabit,
  } = useHabits();
  const today = getTodayString();

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
    void toggleCheckInToday(habitId).catch((error) => {
      showActionError("Unable to update habit", error);
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
            void deleteHabit(habitId).catch((error) => {
              showActionError("Unable to delete habit", error);
            });
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Practice",
        }}
      />
      <Host matchContents useViewportSizeMeasurement style={{ flex: 1 }}>
        <List>
          {!isCloudAvailable ? (
            <Section title="Sync">
              {error ? (
                <Text color="red">{error}</Text>
              ) : (
                <Text>iCloud is unavailable on this device.</Text>
              )}
            </Section>
          ) : null}
          <Section title="Your Habits">
            {!isLoaded ? (
              <Text>Loading your habits...</Text>
            ) : (
              habits.map((habit) => {
                const checkedToday = hasCheckInToday(habit.checkins, today);
                return (
                  <ContextMenu key={habit.id} activationMethod="longPress">
                    <ContextMenu.Items>
                      <Button
                        color={APP_ACCENT_COLOR}
                        systemImage={
                          checkedToday ? "circle" : "checkmark.circle"
                        }
                        onPress={() => handleToggle(habit.id)}
                      >
                        {checkedToday ? "Mark Incomplete" : "Mark Complete"}
                      </Button>
                      <Button
                        role="destructive"
                        systemImage="trash"
                        onPress={() => handleDelete(habit.id, habit.name)}
                      >
                        Delete
                      </Button>
                    </ContextMenu.Items>
                    <ContextMenu.Trigger>
                      <Button onPress={() => router.push(`/habit/${habit.id}`)}>
                        <HStack>
                          <HStack spacing={10}>
                            <Button onPress={() => handleToggle(habit.id)}>
                              <Image
                                size={22}
                                systemName={
                                  checkedToday
                                    ? "checkmark.circle.fill"
                                    : "circle"
                                }
                                color={
                                  checkedToday ? APP_ACCENT_COLOR : "secondary"
                                }
                              />
                            </Button>
                            <Text color="primary">{habit.name}</Text>
                          </HStack>
                          <Spacer />
                          <Image
                            systemName="chevron.right"
                            size={14}
                            color="secondary"
                          />
                        </HStack>
                      </Button>
                    </ContextMenu.Trigger>
                  </ContextMenu>
                );
              })
            )}
            <Button onPress={handleAddOpen}>
              <HStack spacing={10}>
                <Image
                  systemName="plus.circle.fill"
                  color={APP_ACCENT_COLOR}
                  size={22}
                />
                <Text color={APP_ACCENT_COLOR}>Add Habit</Text>
              </HStack>
            </Button>
          </Section>
        </List>
      </Host>
    </>
  );
}
