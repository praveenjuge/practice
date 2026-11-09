import { useWindowDimensions } from "react-native";
import type { HabitHistoryWeek } from "../lib/habits-store";
import { HabitHistoryGrid, HISTORY_COLUMN_STRIDE } from "./habit-history-grid";

// Horizontal space the list row takes around the grid (Material list insets).
const ROW_INSETS = 48;

// Android: Compose scroll views always open at the start, which would hide
// today. Show the most recent weeks that fit the screen instead.
export function HabitStreakHistory({ weeks }: { weeks: HabitHistoryWeek[] }) {
  const { width } = useWindowDimensions();
  const visibleWeeks = Math.max(
    1,
    Math.floor((width - ROW_INSETS) / HISTORY_COLUMN_STRIDE)
  );
  return <HabitHistoryGrid weeks={weeks.slice(-visibleWeeks)} />;
}
