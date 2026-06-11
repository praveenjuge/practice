import { router, Stack } from "expo-router";
import { useCallback, useState } from "react";
import { HabitForm, type HabitFormInput } from "../habit-form";
import { useHabits } from "../habits-store";

export default function NewHabitScreen() {
  const { addHabit } = useHabits();
  const [isSaving, setIsSaving] = useState(false);
  const [submitFromHeader, setSubmitFromHeader] = useState<(() => void) | null>(
    null
  );

  const handleSubmit = useCallback(
    async (input: HabitFormInput) => {
      await addHabit(input);
      router.back();
    },
    [addHabit]
  );

  const handleHeaderSubmit = useCallback(() => {
    submitFromHeader?.();
  }, [submitFromHeader]);

  const handleSubmitReady = useCallback((submit: (() => void) | null) => {
    setSubmitFromHeader((previousSubmit) =>
      previousSubmit === submit ? previousSubmit : submit
    );
  }, []);

  const isHeaderDisabled = !submitFromHeader || isSaving;

  return (
    <>
      <Stack.Screen
        options={{
          title: "New Habit",
          headerLargeTitleEnabled: false,
        }}
      />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          disabled={isHeaderDisabled}
          icon="checkmark"
          onPress={handleHeaderSubmit}
          variant="done"
        />
      </Stack.Toolbar>
      <HabitForm
        autoFocusName
        initialName=""
        onSavingChange={setIsSaving}
        onSubmit={handleSubmit}
        onSubmitReady={handleSubmitReady}
        showSubmitSection={false}
        submitErrorTitle="Unable to add habit"
        submitLabel="Add Habit"
      />
    </>
  );
}
