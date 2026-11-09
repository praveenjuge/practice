import { Stack } from "expo-router";
import { HabitForm } from "../../components/habit-form";
import { useAddHabit } from "../../lib/screen-hooks";

export default function NewHabitScreen() {
  const handleSubmit = useAddHabit();

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
