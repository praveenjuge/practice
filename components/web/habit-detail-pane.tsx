import { Text } from "@expo/ui";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useHabitDetail, useHabits } from "../../lib/habits-store";
import { getHabitCategory } from "../../shared/habit-categories";
import { HabitStreakHistory } from "../habit-streak-history";
import { DeleteDialog } from "./delete-dialog";
import { ActionRow, InsetSection, KeyValueRow } from "./inset-section";
import { DANGER_COLOR, FONT_SUBHEAD, usePalette } from "./palette";

const CHEVRON_GLYPH = "›";

function EmptyDetail({ title, message }: { message: string; title: string }) {
  const palette = usePalette();
  return (
    <View style={styles.empty}>
      <Text
        textStyle={{ color: palette.text, fontSize: 22, fontWeight: "700" }}
      >
        {title}
      </Text>
      <Text
        textStyle={{
          color: palette.secondary,
          fontSize: FONT_SUBHEAD,
          textAlign: "center",
        }}
      >
        {message}
      </Text>
    </View>
  );
}

export function HabitDetailPane({ habitId }: { habitId?: string }) {
  const { deleteHabit, toggleCheckInToday } = useHabits();
  const result = useHabitDetail(habitId);
  const habit = result.status === "ready" ? result.detail : undefined;
  const palette = usePalette();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = useCallback(() => {
    if (!habit) {
      return;
    }
    setError(null);
    // Queued and synced in the background, so it works offline too.
    toggleCheckInToday(habit.id);
  }, [habit, toggleCheckInToday]);

  const handleDelete = useCallback(() => {
    if (!habit) {
      return;
    }
    setError(null);
    deleteHabit(habit.id)
      .then(() => {
        setDeleting(false);
        router.replace("/");
      })
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error ? reason.message : "Unable to delete habit."
        );
      });
  }, [deleteHabit, habit]);

  const handleEdit = useCallback(() => {
    if (habit) {
      router.push(`/habit/edit/${habit.id}`);
    }
  }, [habit]);

  const openDeleteDialog = useCallback(() => setDeleting(true), []);
  const closeDeleteDialog = useCallback(() => setDeleting(false), []);

  if (!habitId) {
    return (
      <EmptyDetail
        message="Choose a habit from the list to see its streak history."
        title="Select a habit"
      />
    );
  }
  if (result.status === "loading") {
    return <View style={styles.empty} />;
  }
  if (!habit) {
    return (
      <EmptyDetail
        message="This habit no longer exists."
        title="Habit not found"
      />
    );
  }

  const { checkedToday, history, stats } = habit;

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
        <KeyValueRow
          label="Last check-in"
          value={stats.lastCheckin ?? "Never"}
        />
      </InsetSection>
      <InsetSection title="History">
        <View style={styles.historyWrap}>
          <HabitStreakHistory weeks={history} />
        </View>
      </InsetSection>
      <InsetSection title="Actions">
        <ActionRow
          label={checkedToday ? "Mark as Incomplete" : "Mark as Complete"}
          onPress={handleToggle}
        />
        <ActionRow
          label="Edit habit"
          onPress={handleEdit}
          trailingGlyph={CHEVRON_GLYPH}
        />
        <ActionRow
          destructive
          label="Delete habit"
          onPress={openDeleteDialog}
          trailingGlyph={CHEVRON_GLYPH}
        />
      </InsetSection>
      {deleting ? (
        <DeleteDialog
          message={`This removes ${habit.name} and all of its streak history.`}
          onCancel={closeDeleteDialog}
          onConfirm={handleDelete}
          title="Delete habit?"
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
