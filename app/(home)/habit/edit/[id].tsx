import React, { useCallback, useMemo, useState } from "react";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import {
  HabitForm,
  type HabitFormInput,
} from "../../../../components/habit-form";
import { APP_ACCENT_COLOR } from "../../../../components/app-colors";
import { useHabits } from "../../../../components/habits-store";
import { ActivityIndicator, Pressable } from "react-native";
import { Host, HStack, List, Spacer, Text } from "@expo/ui/swift-ui";

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { habits, updateHabit } = useHabits();
  const [isSaving, setIsSaving] = useState(false);
  const [submitFromHeader, setSubmitFromHeader] = useState<(() => void) | null>(
    null,
  );
  const habitId = Array.isArray(id) ? id[0] : id;
  const habit = useMemo(
    () => habits.find((item) => item.id === habitId),
    [habits, habitId],
  );

  const handleHeaderSubmit = useCallback(() => {
    submitFromHeader?.();
  }, [submitFromHeader]);

  const handleSubmitReady = useCallback((submit: (() => void) | null) => {
    setSubmitFromHeader((previousSubmit) =>
      previousSubmit === submit ? previousSubmit : submit,
    );
  }, []);

  const handleSubmit = useCallback(
    async (input: HabitFormInput) => {
      if (!habit) {
        throw new Error("Habit not found.");
      }
      await updateHabit(habit.id, input);
      router.back();
    },
    [habit, updateHabit],
  );

  if (!habit) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Habit" }} />
        <Host matchContents useViewportSizeMeasurement style={{ flex: 1 }}>
          <List>
            <HStack>
              <Text>Not found</Text>
              <Spacer />
              <Text color="secondary">This habit no longer exists</Text>
            </HStack>
          </List>
        </Host>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Edit Habit",
          headerRight: () => (
            <Pressable
              accessibilityLabel="Save changes"
              accessibilityRole="button"
              onPress={handleHeaderSubmit}
              disabled={!submitFromHeader || isSaving}
              style={{
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                opacity: !submitFromHeader || isSaving ? 0.45 : 1,
              }}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={APP_ACCENT_COLOR} />
              ) : (
                <SymbolView
                  name="checkmark"
                  resizeMode="scaleAspectFit"
                  tintColor={APP_ACCENT_COLOR}
                  weight="semibold"
                  style={{
                    width: 20,
                    height: 20,
                  }}
                />
              )}
            </Pressable>
          ),
        }}
      />
      <HabitForm
        initialName={habit.name}
        initialCategoryId={habit.categoryId}
        submitLabel="Save Changes"
        submitErrorTitle="Unable to update habit"
        showSubmitSection={false}
        onSubmitReady={handleSubmitReady}
        onSavingChange={setIsSaving}
        onSubmit={handleSubmit}
      />
    </>
  );
}
