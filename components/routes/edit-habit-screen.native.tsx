import { Host, List, ListItem } from "@expo/ui";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo } from "react";
import { HabitForm, type HabitFormInput } from "../habit-form";
import { useHabits } from "../habits-store";

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { habits, updateHabit } = useHabits();
  const habitId = Array.isArray(id) ? id[0] : id;
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

  if (!habit) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Habit" }} />
        <Host style={{ flex: 1 }}>
          <List>
            <ListItem supportingText="This habit no longer exists.">
              Not found
            </ListItem>
          </List>
        </Host>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{ headerLargeTitleEnabled: false, title: "Edit Habit" }}
      />
      <HabitForm
        initialCategoryId={habit.categoryId}
        initialName={habit.name}
        onSubmit={handleSubmit}
        submitErrorTitle="Unable to update habit"
        submitLabel="Save Changes"
      />
    </>
  );
}
