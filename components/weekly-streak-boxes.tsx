import { Row, Spacer } from "@expo/ui";
import { APP_ACCENT_COLOR } from "../lib/app-colors";
import type { RecentDay } from "../lib/habits-store";

// Fits a phone row without scrolling; iOS shows all recent days in a
// trailing-anchored scroll view instead (weekly-streak-boxes.ios.tsx).
const VISIBLE_DAYS = 14;
const BOX_SIZE = 14;
const BOX_CORNER_RADIUS = 4;
const BOX_SPACING = 4;
const MISSED_COLOR = "#d8dde4";

export function WeeklyStreakBoxes({ days }: { days: RecentDay[] }) {
  return (
    <Row spacing={BOX_SPACING}>
      {days.slice(-VISIBLE_DAYS).map((day) => (
        <Spacer
          key={day.date}
          style={{
            backgroundColor: day.completed ? APP_ACCENT_COLOR : MISSED_COLOR,
            borderRadius: BOX_CORNER_RADIUS,
            height: BOX_SIZE,
            width: BOX_SIZE,
          }}
        />
      ))}
    </Row>
  );
}
