import { Text } from "@expo/ui";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { getHabitCategory } from "../habit-categories";
import { HabitStreakHistory } from "../habit-streak-history";
import {
  getYearHabitHistory,
  type Habit,
  hasCheckInToday,
  useHabits,
} from "../habits-store";
import { DeleteDialog } from "./delete-dialog";
import { ActionRow, InsetSection, KeyValueRow } from "./inset-section";
import { DANGER_COLOR, FONT_SUBHEAD, usePalette } from "./palette";

const CHEVRON_GLYPH = "›";

export function HabitDetailPane({ habit }: { habit?: Habit }) {
  const { deleteHabit, today, toggleCheckInToday } = useHabits();
  const palette = usePalette();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!habit) {
    return (
      <View style={styles.empty}>
        <Text
          textStyle={{ color: palette.text, fontSize: 22, fontWeight: "700" }}
        >
          Select a habit
        </Text>
        <Text
          textStyle={{
            color: palette.secondary,
            fontSize: FONT_SUBHEAD,
            textAlign: "center",
          }}
        >
          Choose a habit from the list to see its streak history.
        </Text>
      </View>
    );
  }

  const stats = habit.stats;
  const isComplete = hasCheckInToday(habit.checkins, today);
  const history = getYearHabitHistory(habit.checkins, today);
  const lastCheckin = stats.lastCheckin ?? "Never";

  const handleToggle = () => {
    setError(null);
    toggleCheckInToday(habit.id).catch((err) => {
      setError(err instanceof Error ? err.message : "Unable to update habit.");
    });
  };

  const handleDelete = () => {
    setError(null);
    deleteHabit(habit.id)
      .then(() => {
        setDeleting(false);
        router.replace("/");
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Unable to delete habit."
        );
      });
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.titleBlock}>
        <Text
          textStyle={{
            color: palette.text,
            fontSize: 26,
            fontWeight: "700",
            letterSpacing: -0.4,
          }}
        >
          {habit.name}
        </Text>
        <Text textStyle={{ color: palette.secondary, fontSize: FONT_SUBHEAD }}>
          {getHabitCategory(habit.categoryId).label}
        </Text>
      </View>
      {error ? (
        <Text textStyle={{ color: DANGER_COLOR, fontSize: FONT_SUBHEAD }}>
          {error}
        </Text>
      ) : null}
      <InsetSection title="Streaks">
        <KeyValueRow label="Current" value={`${stats.currentStreak}`} />
        <KeyValueRow label="Highest" value={`${stats.bestStreak}`} />
      </InsetSection>
      <InsetSection title="Progress">
        <KeyValueRow label="Total check-ins" value={`${stats.totalCheckins}`} />
        <KeyValueRow label="Last check-in" value={lastCheckin} />
      </InsetSection>
      <InsetSection title="History">
        <View style={styles.historyWrap}>
          <HabitStreakHistory weeks={history} />
        </View>
      </InsetSection>
      <InsetSection title="Actions">
        <ActionRow
          label={isComplete ? "Mark as Incomplete" : "Mark as Complete"}
          onPress={handleToggle}
        />
        <ActionRow
          label="Edit habit"
          onPress={() => router.push(`/habit/edit/${habit.id}`)}
          trailingGlyph={CHEVRON_GLYPH}
        />
        <ActionRow
          destructive
          label="Delete habit"
          onPress={() => setDeleting(true)}
          trailingGlyph={CHEVRON_GLYPH}
        />
      </InsetSection>
      {deleting ? (
        <DeleteDialog
          habitName={habit.name}
          onCancel={() => setDeleting(false)}
          onConfirm={handleDelete}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 22,
    marginHorizontal: "auto",
    maxWidth: 720,
    padding: 24,
    width: "100%",
  },
  empty: {
    alignItems: "center",
    flex: 1,
    gap: 10,
    justifyContent: "center",
    padding: 24,
  },
  historyWrap: { paddingHorizontal: 16, paddingVertical: 12 },
  titleBlock: { gap: 6 },
});
