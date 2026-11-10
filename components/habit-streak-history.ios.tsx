import type { CommonViewModifierProps } from "@expo/ui/swift-ui";
import { requireNativeView } from "expo";
import { APP_ACCENT_COLOR } from "../lib/app-colors";
import type { HabitHistoryWeek } from "../lib/habits-store";

// The native SwiftUI heatmap from native/HabitHeatmapModule.swift.
interface HabitHeatmapProps extends CommonViewModifierProps {
  accentColor: string;
  cells: number[];
  labels: string[];
}

const HabitHeatmap = requireNativeView<HabitHeatmapProps>(
  "HabitHeatmapModule",
  "HabitHeatmapView"
);

const DAYS_PER_WEEK = 7;
const OUT_OF_RANGE = 0;
const MISSED = 1;
const COMPLETED = 2;

const toCells = (weeks: HabitHistoryWeek[]) =>
  weeks.flatMap((week) =>
    Array.from({ length: DAYS_PER_WEEK }, (_, index) => {
      const day = week.days[index];
      if (!day?.inRange) {
        return OUT_OF_RANGE;
      }
      return day.completed ? COMPLETED : MISSED;
    })
  );

export function HabitStreakHistory({ weeks }: { weeks: HabitHistoryWeek[] }) {
  return (
    <HabitHeatmap
      accentColor={APP_ACCENT_COLOR}
      cells={toCells(weeks)}
      labels={weeks.map((week) => week.monthLabel ?? "")}
    />
  );
}
