import { Text, TextInput } from "@expo/ui";
import { router } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { type Habit, useHabits } from "../../lib/habits-store";
import { FONT_SUBHEAD, usePalette } from "./palette";
import { AppButton, HoverPressable } from "./pointer";

const MINI_DOT_COUNT = 14;
const openNewHabit = () => router.push("/habit/new");

const HabitRow = memo(function HabitRowContent({
  habit,
  isSelected,
}: {
  habit: Habit;
  isSelected: boolean;
}) {
  const palette = usePalette();
  const isComplete = habit.checkedToday;
  const dots = habit.recentDays.slice(-MINI_DOT_COUNT);
  const { toggleCheckInToday } = useHabits();
  const handleOpen = useCallback(
    () => router.push(`/habit/${habit.id}`),
    [habit.id]
  );
  // The circle checks the habit in; the rest of the row opens it.
  const handleToggle = useCallback(
    () => toggleCheckInToday(habit.id),
    [habit.id, toggleCheckInToday]
  );

  // The check-in circle and the "open" area are siblings, not nested, so
  // each is its own control for keyboards and screen readers.
  return (
    <View
      style={[
        styles.row,
        isSelected ? { backgroundColor: palette.accentSoft } : null,
      ]}
    >
      <HoverPressable
        accessibilityLabel={
          isComplete
            ? `Mark ${habit.name} incomplete`
            : `Check in ${habit.name}`
        }
        checked={isComplete}
        hoverStyle={{ backgroundColor: palette.accentSoft }}
        onPress={handleToggle}
        role="checkbox"
        style={styles.checkHit}
      >
        <View
          style={[
            styles.checkDot,
            {
              backgroundColor: isComplete ? palette.accent : "transparent",
              borderColor: isComplete ? palette.accent : palette.secondary,
            },
          ]}
        />
      </HoverPressable>
      <HoverPressable
        accessibilityLabel={`Open ${habit.name}`}
        hoverStyle={{ backgroundColor: palette.hover }}
        onPress={handleOpen}
        style={styles.rowMain}
      >
        <Text
          numberOfLines={1}
          textStyle={{
            color: isSelected ? palette.accent : palette.text,
            fontSize: FONT_SUBHEAD,
            fontWeight: isSelected ? "700" : "600",
          }}
        >
          {habit.name}
        </Text>
        <View style={styles.miniStreak}>
          {dots.map((day) => (
            <View
              key={day.date}
              style={[
                styles.miniDot,
                {
                  backgroundColor: day.completed
                    ? palette.accent
                    : palette.track,
                },
              ]}
            />
          ))}
        </View>
      </HoverPressable>
    </View>
  );
});

export function HabitListPane({
  habits,
  selectedHabitId,
}: {
  habits: Habit[];
  selectedHabitId?: string;
}) {
  const palette = usePalette();
  const [query, setQuery] = useState("");
  const filteredHabits = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return habits;
    }
    return habits.filter((habit) =>
      habit.name.toLowerCase().includes(normalized)
    );
  }, [habits, query]);

  const emptyLabel = query.trim()
    ? "No habit matches that search."
    : "No habits yet.";

  return (
    <View
      style={[
        styles.pane,
        {
          backgroundColor: palette.sidebar,
          borderRightColor: palette.hairline,
        },
      ]}
    >
      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <TextInput
            onChangeText={setQuery}
            placeholder="Search habits"
            placeholderTextColor={palette.secondary}
            style={{
              backgroundColor: palette.track,
              borderRadius: 9,
              height: 38,
              paddingHorizontal: 12,
              width: "100%",
            }}
            textStyle={{ color: palette.text }}
          />
        </View>
        <AppButton label="New" onPress={openNewHabit} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {filteredHabits.length === 0 ? (
          <Text
            style={styles.empty}
            textStyle={{ color: palette.secondary, fontSize: FONT_SUBHEAD }}
          >
            {emptyLabel}
          </Text>
        ) : (
          filteredHabits.map((habit) => (
            <HabitRow
              habit={habit}
              isSelected={habit.id === selectedHabitId}
              key={habit.id}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  checkDot: { borderRadius: 10, borderWidth: 2, height: 20, width: 20 },
  // A bigger target than the dot itself, pulled back so the row keeps its
  // alignment.
  checkHit: { borderRadius: 16, margin: -6, padding: 6 },
  content: { gap: 4, paddingBottom: 16, paddingHorizontal: 10 },
  empty: { padding: 24 },
  miniDot: { borderRadius: 3, height: 6, width: 6 },
  miniStreak: { flexDirection: "row", gap: 3 },
  pane: {
    borderRightWidth: StyleSheet.hairlineWidth,
    flexBasis: 340,
    maxWidth: 400,
  },
  row: {
    alignItems: "center",
    borderRadius: 10,
    flexDirection: "row",
    gap: 6,
    paddingLeft: 12,
  },
  rowMain: {
    borderRadius: 10,
    flex: 1,
    gap: 6,
    minWidth: 0,
    paddingHorizontal: 6,
    paddingVertical: 11,
  },
  searchWrap: { flex: 1 },
  toolbar: { flexDirection: "row", gap: 10, padding: 14 },
});
