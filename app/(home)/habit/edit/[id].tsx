import { Host, HStack, List, Spacer, Text } from "@expo/ui/swift-ui";
import { foregroundStyle } from "@expo/ui/swift-ui/modifiers";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable } from "react-native";
import {
  HabitForm,
  type HabitFormInput,
} from "../../../../components/habit-form";
import { useHabits } from "../../../../components/habits-store";

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { habits, updateHabit } = useHabits();
  const [isSaving, setIsSaving] = useState(false);
  const [submitFromHeader, setSubmitFromHeader] = useState<(() => void) | null>(
    null
  );
  const habitId = Array.isArray(id) ? id[0] : id;
  const habit = useMemo(
    () => habits.find((item) => item.id === habitId),
    [habits, habitId]
  );

  const handleHeaderSubmit = useCallback(() => {
    submitFromHeader?.();
  }, [submitFromHeader]);

  const handleSubmitReady = useCallback((submit: (() => void) | null) => {
    setSubmitFromHeader((previousSubmit) =>
      previousSubmit === submit ? previousSubmit : submit
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
    [habit, updateHabit]
  );

  if (!habit) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Habit" }} />
        <Host style={{ flex: 1 }}>
          <List>
            <HStack>
              <Text>Not found</Text>
              <Spacer />
              <Text
                modifiers={[
                  foregroundStyle({
                    type: "hierarchical",
                    style: "secondary",
                  }),
                ]}
              >
                This habit no longer exists
              </Text>
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
          headerLargeTitleEnabled: false,
          headerRight: () => (
            <Pressable
              accessibilityLabel="Save changes"
              accessibilityRole="button"
              disabled={!submitFromHeader || isSaving}
              hitSlop={8}
              onPress={handleHeaderSubmit}
            >
              {isSaving ? (
                <ActivityIndicator size="small" />
              ) : (
                <SymbolView name="checkmark" />
              )}
            </Pressable>
          ),
        }}
      />
      <HabitForm
        initialCategoryId={habit.categoryId}
        initialName={habit.name}
        onSavingChange={setIsSaving}
        onSubmit={handleSubmit}
        onSubmitReady={handleSubmitReady}
        showSubmitSection={false}
        submitErrorTitle="Unable to update habit"
        submitLabel="Save Changes"
      />
    </>
  );
}
