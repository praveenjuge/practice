import { Text, TextInput } from "@expo/ui";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { MAX_HABIT_NAME_LENGTH } from "../../convex/model/stats";
import {
  HABIT_CATEGORIES,
  HABIT_CATEGORY_GROUP_ORDER,
  type HabitCategoryId,
  resolveHabitCategoryId,
} from "../habit-categories";
import { useHabits } from "../habits-store";
import { InsetSection } from "./inset-section";
import { DANGER_COLOR, FONT_BODY, usePalette } from "./palette";
import { AppButton, HoverPressable } from "./pointer";

const CHECK_GLYPH = "✓";

export function HabitFormScreen({ habitId }: { habitId?: string }) {
  const { addHabit, habits, updateHabit } = useHabits();
  const existingHabit = habits.find((habit) => habit.id === habitId);
  const isEditing = Boolean(habitId);
  const palette = usePalette();
  const [name, setName] = useState(existingHabit?.name ?? "");
  const [categoryId, setCategoryId] = useState<HabitCategoryId>(
    resolveHabitCategoryId(existingHabit?.categoryId)
  );
  const [error, setError] = useState<string | null>(null);

  const groupedCategories = useMemo(
    () =>
      HABIT_CATEGORY_GROUP_ORDER.map((group) => ({
        categories: HABIT_CATEGORIES.filter(
          (category) => category.group === group
        ),
        group,
      })),
    []
  );

  const save = () => {
    setError(null);
    const run = async () => {
      if (isEditing) {
        if (!existingHabit) {
          throw new Error("Habit not found.");
        }
        await updateHabit(existingHabit.id, { categoryId, name });
        router.replace(`/habit/${existingHabit.id}`);
        return;
      }
      await addHabit({ categoryId, name });
      router.replace("/");
    };
    run().catch((err) => {
      setError(err instanceof Error ? err.message : "Unable to save habit.");
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.column}>
        <InsetSection title="Habit">
          <TextInput
            autoFocus
            defaultValue={existingHabit?.name ?? ""}
            maxLength={MAX_HABIT_NAME_LENGTH}
            onChangeText={setName}
            onSubmitEditing={save}
            placeholder="Habit name"
            placeholderTextColor={palette.secondary}
            style={{ height: 48, paddingHorizontal: 16, width: "100%" }}
            textStyle={{ color: palette.text, fontSize: FONT_BODY }}
          />
        </InsetSection>
        {groupedCategories.map((section) => (
          <InsetSection key={section.group} title={section.group}>
            {section.categories.map((category) => {
              const selected = category.id === categoryId;
              return (
                <HoverPressable
                  hoverStyle={{ backgroundColor: palette.hover }}
                  key={category.id}
                  onPress={() => setCategoryId(category.id)}
                  style={styles.categoryRow}
                >
                  <Text
                    textStyle={{
                      color: selected ? palette.accent : palette.text,
                      fontSize: FONT_BODY,
                    }}
                  >
                    {category.label}
                  </Text>
                  {selected ? (
                    <>
                      <View style={styles.spacer} />
                      <Text
                        textStyle={{
                          color: palette.accent,
                          fontSize: FONT_BODY,
                        }}
                      >
                        {CHECK_GLYPH}
                      </Text>
                    </>
                  ) : null}
                </HoverPressable>
              );
            })}
          </InsetSection>
        ))}
        {error ? (
          <Text textStyle={{ color: DANGER_COLOR, fontSize: FONT_BODY }}>
            {error}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <AppButton
            label="Cancel"
            onPress={() => router.back()}
            variant="outlined"
          />
          <AppButton label={isEditing ? "Save" : "Create"} onPress={save} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  categoryRow: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  column: { gap: 18, maxWidth: 680, width: "100%" },
  footer: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
  page: { alignItems: "center", padding: 24 },
  spacer: { flex: 1, minWidth: 12 },
});
