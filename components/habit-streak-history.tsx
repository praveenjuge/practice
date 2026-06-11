import { Column, Row, ScrollView, Spacer, Text } from "@expo/ui";
import { APP_ACCENT_COLOR } from "./app-colors";
import type { HabitHistoryWeek } from "./habits-store";

const BOX_WIDTH = 12;
const BOX_HEIGHT = 12;
const BOX_CORNER_RADIUS = 2;
const BOX_SPACING = 3;
const LABEL_ROW_HEIGHT = 14;
const EMPTY_CELL_OPACITY = 0.5;
const MISSED_COLOR = "#d8dde4";

interface HabitStreakHistoryProps {
  weeks: HabitHistoryWeek[];
}

export function HabitStreakHistory({ weeks }: HabitStreakHistoryProps) {
  return (
    <ScrollView direction="horizontal" showsIndicators={false}>
      <Column alignment="start" spacing={BOX_SPACING}>
        <Row spacing={BOX_SPACING}>
          {weeks.map((week) => (
            <Text
              key={`label-${week.weekStart}`}
              numberOfLines={1}
              style={{ height: LABEL_ROW_HEIGHT, width: BOX_WIDTH }}
              textStyle={{ color: "#6b7280", fontSize: 10 }}
            >
              {week.monthLabel ?? ""}
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
    </ScrollView>
  );
}
