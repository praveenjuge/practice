import { router, Stack } from "expo-router";
import { useCallback } from "react";
import { HabitForm, type HabitFormInput } from "../habit-form";
import { useHabits } from "../habits-store";

export default function NewHabitScreen() {
  const { addHabit } = useHabits();

  const handleSubmit = useCallback(
    async (input: HabitFormInput) => {
      await addHabit(input);
      router.back();
    },
    [addHabit]
  );

  return (
    <>
      <Stack.Screen
        options={{ headerLargeTitleEnabled: false, title: "New Habit" }}
      />
      <HabitForm
        autoFocusName
        initialName=""
        onSubmit={handleSubmit}
        submitErrorTitle="Unable to add habit"
        submitLabel="Add Habit"
      />
    </>
  );
}
