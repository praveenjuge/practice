import { Alert, Platform } from "react-native";
import type { Habit } from "./habits-store";

type HabitContextActionDeps = {
  toggleCheckInToday: (id: string) => Promise<void>;
  renameHabit: (id: string, name: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
};

export type HabitContextHandlers = {
  handleToggle: (habit: Habit) => void;
  handleEdit: (habit: Habit) => void;
  handleDelete: (habit: Habit) => void;
};

export const createHabitContextHandlers = (
  deps: HabitContextActionDeps
): HabitContextHandlers => {
  const { toggleCheckInToday, renameHabit, deleteHabit } = deps;

  const handleToggle = (habit: Habit) => {
    void toggleCheckInToday(habit.id);
  };

  const handleDelete = (habit: Habit) => {
    Alert.alert(
      "Delete habit?",
      `This will remove "${habit.name}" and all of its check-ins.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void deleteHabit(habit.id);
          },
        },
      ]
    );
  };

  const handleEdit = (habit: Habit) => {
    if (Platform.OS === "ios" && "prompt" in Alert) {
      Alert.prompt(
        "Edit habit",
        "Update the habit name.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Save",
            onPress: async (value?: string) => {
              const trimmed = value?.trim();
              if (!trimmed) {
                return;
              }
              await renameHabit(habit.id, trimmed);
            },
          },
        ],
        "plain-text",
        habit.name,
        "Habit name"
      );
      return;
    }

    Alert.alert(
      "Edit habit",
      "Editing a habit currently requires iOS because native prompt alerts are not available on Android."
    );
  };

  return {
    handleToggle,
    handleEdit,
    handleDelete,
  };
};
