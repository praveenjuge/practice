// Behavior shared by the iOS and Android screens. Each screen keeps its own
// platform UI and calls these for the logic.
import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import type { HabitFormInput } from "../components/habit-form";
import { type Habit, useHabitIdParam, useHabits } from "./habits-store";
import { signIn } from "./session";

export const showActionError = (title: string, error: unknown) => {
  Alert.alert(
    title,
    error instanceof Error ? error.message : "Please try again."
  );
};

/** Checks a habit in or out for today, with a haptic on check-in. */
export function useToggleHabit() {
  const { toggleCheckInToday } = useHabits();
  return useCallback(
    (habit: Pick<Habit, "checkedToday" | "id">) => {
      if (!habit.checkedToday) {
        notificationAsync(NotificationFeedbackType.Success);
      }
      toggleCheckInToday(habit.id).catch((error: unknown) => {
        showActionError("Unable to update habit", error);
      });
    },
    [toggleCheckInToday]
  );
}

/** Filters habits by the header search bar's text. */
export function useHabitSearch(habits: Habit[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const trimmedSearchQuery = searchQuery.trim();
  const filteredHabits = trimmedSearchQuery
    ? habits.filter((habit) =>
        habit.name.toLowerCase().includes(trimmedSearchQuery.toLowerCase())
      )
    : habits;
  const handleSearch = useCallback(
    (event: { nativeEvent: { text: string } }) =>
      setSearchQuery(event.nativeEvent.text),
    []
  );
  return { filteredHabits, handleSearch, trimmedSearchQuery };
}

/** Edit, toggle and delete for the habit details screen. */
export function useHabitDetailActions(
  habit: Pick<Habit, "checkedToday" | "id"> | undefined
) {
  const { deleteHabit } = useHabits();
  const toggleHabit = useToggleHabit();

  const handleEdit = useCallback(() => {
    if (habit) {
      router.push(`/habit/edit/${habit.id}`);
    }
  }, [habit]);

  const handleToggle = useCallback(() => {
    if (habit) {
      toggleHabit(habit);
    }
  }, [habit, toggleHabit]);

  const handleDelete = useCallback(() => {
    if (!habit) {
      return;
    }
    Alert.alert(
      "Delete habit?",
      "This removes the habit and its streak history.",
      [
        { style: "cancel", text: "Cancel" },
        {
          onPress: async () => {
            notificationAsync(NotificationFeedbackType.Warning);
            try {
              await deleteHabit(habit.id);
              router.back();
            } catch (error) {
              showActionError("Unable to delete habit", error);
            }
          },
          style: "destructive",
          text: "Delete",
        },
      ]
    );
  }, [deleteHabit, habit]);

  return { handleDelete, handleEdit, handleToggle };
}

/** The habit named by the route, and a submit that saves it and goes back. */
export function useEditHabit() {
  const { habits, updateHabit } = useHabits();
  const habitId = useHabitIdParam();
  const habit = useMemo(
    () => habits.find((item) => item.id === habitId),
    [habits, habitId]
  );
  const handleSubmit = useCallback(
    async (input: HabitFormInput) => {
      if (!habit) {
        throw new Error("Habit not found.");
      }
      await updateHabit(habit.id, input);
      router.back();
    },
    [habit, updateHabit]
  );
  return { habit, handleSubmit };
}

/** Adds a habit and goes back. */
export function useAddHabit() {
  const { addHabit } = useHabits();
  return useCallback(
    async (input: HabitFormInput) => {
      await addHabit(input);
      router.back();
    },
    [addHabit]
  );
}

/** Wires a header Save button to a form whose own submit button is hidden. */
export function useHeaderSubmit() {
  const [isSaving, setIsSaving] = useState(false);
  const [submitFromHeader, setSubmitFromHeader] = useState<(() => void) | null>(
    null
  );
  const handleHeaderSubmit = useCallback(() => {
    submitFromHeader?.();
  }, [submitFromHeader]);
  const handleSubmitReady = useCallback((submit: (() => void) | null) => {
    setSubmitFromHeader((previousSubmit) =>
      previousSubmit === submit ? previousSubmit : submit
    );
  }, []);
  return {
    handleHeaderSubmit,
    handleSubmitReady,
    isHeaderDisabled: !submitFromHeader || isSaving,
    setIsSaving,
  };
}

/** Starts sign-in and tracks whether it's in progress. */
export function useSignIn() {
  const [busy, setBusy] = useState(false);
  const handleSignIn = useCallback(() => {
    setBusy(true);
    signIn()
      .catch((error: unknown) => {
        showActionError("Couldn't sign in", error);
      })
      .finally(() => setBusy(false));
  }, []);
  return { busy, handleSignIn };
}
