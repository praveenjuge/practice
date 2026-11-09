import { Column, Row, Spacer, Text } from "@expo/ui";
import { APP_ACCENT_COLOR } from "./app-colors";
import type { HabitHistoryWeek } from "./habits-store";

const BOX_WIDTH = 12;
const BOX_HEIGHT = 12;
const BOX_CORNER_RADIUS = 2;
const BOX_SPACING = 3;
export const HISTORY_COLUMN_STRIDE = BOX_WIDTH + BOX_SPACING;
const LABEL_ROW_HEIGHT = 14;
const EMPTY_CELL_OPACITY = 0.5;
const MISSED_COLOR = "#d8dde4";

interface LabelSpan {
  key: string;
  label: string;
  weeks: number;
}

// Each month label spans the weeks up to the next label (labels are at least
// three weeks apart), so names fit instead of being cut to one column.
const toLabelSpans = (weeks: HabitHistoryWeek[]): LabelSpan[] => {
  const spans: LabelSpan[] = [];
  for (const week of weeks) {
    const last = spans.at(-1);
    if (week.monthLabel || !last) {
      spans.push({
        key: week.weekStart,
        label: week.monthLabel ?? "",
        weeks: 1,
      });
    } else {
      last.weeks += 1;
    }
  }
  return spans;
};

// The year grid itself (month labels + one column per week). Platforms decide
// how to fit it: see habit-streak-history.tsx and habit-streak-history.web.tsx.
export function HabitHistoryGrid({ weeks }: { weeks: HabitHistoryWeek[] }) {
  return (
    <Column alignment="start" spacing={BOX_SPACING}>
      <Row spacing={BOX_SPACING}>
        {toLabelSpans(weeks).map((span) => (
          <Text
            key={`label-${span.key}`}
            numberOfLines={1}
            style={{
              height: LABEL_ROW_HEIGHT,
              width: span.weeks * HISTORY_COLUMN_STRIDE - BOX_SPACING,
            }}
            textStyle={{ color: "#6b7280", fontSize: 10 }}
          >
            {span.label}
          </Text>
        ))}
      </Row>
      <Row alignment="start" spacing={BOX_SPACING}>
        {weeks.map((week) => (
          <Column key={`col-${week.weekStart}`} spacing={BOX_SPACING}>
            {week.days.map((day) => (
              <Spacer
                key={day.date}
                style={{
                  backgroundColor: day.completed
                    ? APP_ACCENT_COLOR
                    : MISSED_COLOR,
                  borderRadius: BOX_CORNER_RADIUS,
                  height: BOX_HEIGHT,
                  opacity: day.inRange ? 1 : EMPTY_CELL_OPACITY,
                  width: BOX_WIDTH,
                }}
              />
            ))}
          </Column>
        ))}
      </Row>
    </Column>
  );
}
