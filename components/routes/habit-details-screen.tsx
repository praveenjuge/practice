import { Text } from "@expo/ui";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useHabits } from "../habits-store";
import { HabitDetailPane } from "../web/habit-detail-pane";
import { HabitListPane } from "../web/habit-list-pane";
import { FONT_SUBHEAD, usePalette } from "../web/palette";
import { Shell, useIsWide } from "../web/shell";

export default function HabitDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const habitId = Array.isArray(id) ? id[0] : id;
  const { habits, isLoaded, today } = useHabits();
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
  // not resolve to a habit (e.g. an optimistic-create temp id mid-flight).
  const selectedHabit =
    habits.find((habit) => habit.id === habitId) ?? habits[0];

  return (
    <Shell title="Practice">
      <View style={isWide ? styles.desktop : styles.mobile}>
        {isWide ? (
          <HabitListPane
            habits={habits}
            selectedHabitId={selectedHabit?.id}
            today={today}
          />
        ) : null}
        <View style={styles.detailPane}>
          <HabitDetailPane habit={selectedHabit} />
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
