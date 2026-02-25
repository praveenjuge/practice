import React, { useCallback, useState } from "react";
import { Stack, router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, Pressable } from "react-native";
import { APP_ACCENT_COLOR } from "../../../components/app-colors";
import { HabitForm, type HabitFormInput } from "../../../components/habit-form";
import { useHabits } from "../../../components/habits-store";

export default function NewHabitScreen() {
  const { addHabit } = useHabits();
  const [isSaving, setIsSaving] = useState(false);
  const [submitFromHeader, setSubmitFromHeader] = useState<(() => void) | null>(
    null,
  );

  const handleSubmit = useCallback(
    async (input: HabitFormInput) => {
      await addHabit(input);
      router.back();
    },
    [addHabit],
  );

  const handleHeaderSubmit = useCallback(() => {
    submitFromHeader?.();
  }, [submitFromHeader]);

  const handleSubmitReady = useCallback((submit: (() => void) | null) => {
    setSubmitFromHeader((previousSubmit) =>
      previousSubmit === submit ? previousSubmit : submit,
    );
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          title: "New Habit",
          headerRight: () => (
            <Pressable
              accessibilityLabel="Add habit"
              accessibilityRole="button"
              onPress={handleHeaderSubmit}
              disabled={!submitFromHeader || isSaving}
              style={{
                width: 38,
                height: 38,
                alignItems: "center",
                justifyContent: "center",
                opacity: !submitFromHeader || isSaving ? 0.45 : 1,
              }}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={APP_ACCENT_COLOR} />
              ) : (
                <SymbolView name="checkmark" weight="semibold" />
              )}
            </Pressable>
          ),
        }}
      />
      <HabitForm
        initialName=""
        submitLabel="Add Habit"
        submitErrorTitle="Unable to add habit"
        showSubmitSection={false}
        onSubmitReady={handleSubmitReady}
        onSavingChange={setIsSaving}
        onSubmit={handleSubmit}
      />
    </>
  );
}
