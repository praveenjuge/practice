import { Text, TextInput } from "@expo/ui";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  getRollingWeekCheckins,
  type Habit,
  hasCheckInToday,
} from "../habits-store";
import { FONT_SUBHEAD, usePalette } from "./palette";
import { AppButton, HoverPressable } from "./pointer";

const MINI_DOT_COUNT = 14;

function HabitRow({
  habit,
  isSelected,
  today,
}: {
  habit: Habit;
  isSelected: boolean;
  today: string;
}) {
  const palette = usePalette();
  const isComplete = hasCheckInToday(habit.checkins, today);
  const dots = getRollingWeekCheckins(habit.checkins, today, MINI_DOT_COUNT);

  return (
    <HoverPressable
      hoverStyle={{ backgroundColor: palette.hover }}
      onPress={() => router.push(`/habit/${habit.id}`)}
      style={[
        styles.row,
        isSelected ? { backgroundColor: palette.accentSoft } : null,
      ]}
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
      <View style={styles.rowMain}>
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
      </View>
    </HoverPressable>
  );
}

export function HabitListPane({
  habits,
  selectedHabitId,
  today,
}: {
  habits: Habit[];
  selectedHabitId?: string;
  today: string;
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
        <AppButton label="New" onPress={() => router.push("/habit/new")} />
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
              today={today}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  checkDot: { borderRadius: 10, borderWidth: 2, height: 20, width: 20 },
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
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  rowMain: { flex: 1, gap: 6, minWidth: 0 },
  searchWrap: { flex: 1 },
  toolbar: { flexDirection: "row", gap: 10, padding: 14 },
});
