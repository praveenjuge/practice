import React from "react";
import { Stack, router } from "expo-router";
import { Platform, Alert, PlatformColor } from "react-native";
import {
  useHabits,
  getTodayString,
  hasCheckInToday,
} from "../../components/habits-store";
import { createHabitContextHandlers } from "../../components/habit-context-actions";
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
    addHabit,
    renameHabit,
    deleteHabit,
  } = useHabits();
  const today = getTodayString();
  const { handleToggle, handleEdit, handleDelete } = createHabitContextHandlers(
    {
      toggleCheckInToday,
      renameHabit,
      deleteHabit,
    }
  );

  const handleAddOpen = () => {
    if (Platform.OS === "ios" && "prompt" in Alert) {
      Alert.prompt(
        "New habit",
        "Give it a name to start tracking.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add",
            onPress: async (value?: string) => {
              const trimmed = value?.trim();
              if (!trimmed) {
                return;
              }
              await addHabit(trimmed);
            },
          },
        ],
        "plain-text",
        "",
        "Habit name"
      );
      return;
    }

    Alert.alert(
      "New habit",
      "Adding a habit currently requires iOS because native prompt alerts are not available on Android."
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
                        systemImage={
                          checkedToday ? "circle" : "checkmark.circle"
                        }
                        onPress={() => handleToggle(habit)}
                      >
                        {checkedToday ? "Mark Incomplete" : "Mark Complete"}
                      </Button>
                      <Button
                        systemImage="pencil"
                        onPress={() => handleEdit(habit)}
                      >
                        Edit
                      </Button>
                      <Button
                        role="destructive"
                        systemImage="trash"
                        onPress={() => handleDelete(habit)}
                      >
                        Delete
                      </Button>
                    </ContextMenu.Items>
                    <ContextMenu.Trigger>
                      <Button onPress={() => router.push(`/habit/${habit.id}`)}>
                        <HStack>
                          <HStack spacing={10}>
                            <Button onPress={() => handleToggle(habit)}>
                              <Image
                                size={22}
                                systemName={
                                  checkedToday
                                    ? "checkmark.circle.fill"
                                    : "circle"
                                }
                                color={
                                  checkedToday
                                    ? (PlatformColor(
                                        "systemGreen"
                                      ) as unknown as string)
                                    : "secondary"
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
                  color={PlatformColor("systemGreen") as unknown as string}
                  size={22}
                />
                <Text color={PlatformColor("systemGreen") as unknown as string}>
                  Add Habit
                </Text>
              </HStack>
            </Button>
          </Section>
        </List>
      </Host>
    </>
  );
}
