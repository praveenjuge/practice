import { Text } from "@expo/ui";
import { StyleSheet, View } from "react-native";
import { HabitDetailPane } from "../../components/web/habit-detail-pane";
import { HabitListPane } from "../../components/web/habit-list-pane";
import { FONT_SUBHEAD, usePalette } from "../../components/web/palette";
import { Shell, useIsWide } from "../../components/web/shell";
import { useHabitIdParam, useHabits } from "../../lib/habits-store";

export default function HabitDetailsScreen() {
  const habitId = useHabitIdParam();
  const { habits, isLoaded } = useHabits();
  const isWide = useIsWide();
  const palette = usePalette();

  if (!isLoaded) {
    return (
      <Shell title="Practice">
        <View style={styles.centered}>
          <Text
            textStyle={{ color: palette.secondary, fontSize: FONT_SUBHEAD }}
          >
            Loading habits…
          </Text>
        </View>
      </Shell>
    );
  }

  // Default-select-first: fall back to the first habit when the URL id does
  // not resolve to a habit (e.g. after it was deleted elsewhere).
  const selectedHabit =
    habits.find((habit) => habit.id === habitId) ?? habits[0];

  return (
    <Shell title="Practice">
      <View style={isWide ? styles.desktop : styles.mobile}>
        {isWide ? (
          <HabitListPane habits={habits} selectedHabitId={selectedHabit?.id} />
        ) : null}
        <View style={styles.detailPane}>
          <HabitDetailPane habitId={selectedHabit?.id} />
        </View>
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  desktop: { flex: 1, flexDirection: "row" },
  detailPane: { flex: 1 },
  mobile: { flex: 1 },
});
