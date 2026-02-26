import { router, Stack } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable } from "react-native";
import { APP_ACCENT_COLOR } from "../../../components/app-colors";
import { HabitForm, type HabitFormInput } from "../../../components/habit-form";
import { useHabits } from "../../../components/habits-store";

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

  return (
    <>
      <Stack.Screen
        options={{
          title: "New Habit",
          headerLargeTitleEnabled: false,
          headerRight: () => (
            <Pressable
              accessibilityLabel="Add habit"
              accessibilityRole="button"
              disabled={!submitFromHeader || isSaving}
              onPress={handleHeaderSubmit}
            >
              {isSaving ? (
                <ActivityIndicator color={APP_ACCENT_COLOR} size="small" />
              ) : (
                <SymbolView name="checkmark" />
              )}
            </Pressable>
          ),
        }}
      />
      <HabitForm
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
