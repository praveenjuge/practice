import { useCallback, useRef } from "react";
import { ScrollView, type ScrollViewInstance } from "react-native";
import { HabitHistoryGrid } from "./habit-history-grid";
import type { HabitHistoryWeek } from "./habits-store";

// Web: the full year scrolls sideways and opens on the newest week.
export function HabitStreakHistory({ weeks }: { weeks: HabitHistoryWeek[] }) {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const scrollToNewest = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: false });
  }, []);

  return (
    <ScrollView
      horizontal
      onContentSizeChange={scrollToNewest}
      ref={scrollRef}
      showsHorizontalScrollIndicator={false}
    >
      <HabitHistoryGrid weeks={weeks} />
    </ScrollView>
  );
}
