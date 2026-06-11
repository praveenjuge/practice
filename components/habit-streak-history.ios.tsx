import {
  HStack,
  RoundedRectangle,
  ScrollView,
  Text,
  VStack,
  ZStack,
} from "@expo/ui/swift-ui";
import {
  accessibilityLabel,
  defaultScrollAnchor,
  fixedSize,
  font,
  foregroundStyle,
  frame,
  offset,
  opacity,
} from "@expo/ui/swift-ui/modifiers";
import { PlatformColor } from "react-native";
import { APP_ACCENT_COLOR } from "./app-colors";
import type { HabitHistoryWeek } from "./habits-store";

const BOX_WIDTH = 12;
const BOX_HEIGHT = 12;
const BOX_CORNER_RADIUS = 2;
const BOX_SPACING = 3;
const COLUMN_STRIDE = BOX_WIDTH + BOX_SPACING;
const LABEL_ROW_HEIGHT = 14;
const LABEL_FONT_SIZE = 10;
const EMPTY_CELL_OPACITY = 0.5;

const MISSED_COLOR = PlatformColor("tertiarySystemFill") as unknown as string;

interface HabitStreakHistoryProps {
  weeks: HabitHistoryWeek[];
}

export function HabitStreakHistory({ weeks }: HabitStreakHistoryProps) {
  const totalCompleted = weeks.reduce(
    (total, week) =>
      total +
      week.days.reduce(
        (weekTotal, day) => (day.completed ? weekTotal + 1 : weekTotal),
        0
      ),
    0
  );
  const totalInRange = weeks.reduce(
    (total, week) =>
      total +
      week.days.reduce(
        (weekTotal, day) => (day.inRange ? weekTotal + 1 : weekTotal),
        0
      ),
    0
  );
  const accessibleLabel = `Last ${totalInRange} days of history: ${totalCompleted} completed.`;
  const gridWidth =
    weeks.length === 0 ? 0 : weeks.length * COLUMN_STRIDE - BOX_SPACING;
  const labeledWeeks = weeks
    .map((week, index) => ({ index, week }))
    .filter((item) => item.week.monthLabel !== undefined);

  return (
    <ScrollView
      axes="horizontal"
      modifiers={[
        accessibilityLabel(accessibleLabel),
        defaultScrollAnchor("trailing"),
      ]}
      showsIndicators={false}
    >
      <VStack alignment="leading" spacing={BOX_SPACING}>
        <ZStack alignment="topLeading">
          <RoundedRectangle
            cornerRadius={0}
            modifiers={[
              foregroundStyle("#00000000"),
              frame({ height: LABEL_ROW_HEIGHT, width: gridWidth }),
            ]}
          />
          {labeledWeeks.map(({ index, week }) => (
            <Text
              key={`label-${week.weekStart}`}
              modifiers={[
                font({ size: LABEL_FONT_SIZE }),
                foregroundStyle({
                  style: "secondary",
                  type: "hierarchical",
                }),
                fixedSize(),
                offset({ x: index * COLUMN_STRIDE }),
              ]}
            >
              {week.monthLabel ?? ""}
            </Text>
          ))}
        </ZStack>
        <HStack alignment="top" spacing={BOX_SPACING}>
          {weeks.map((week) => (
            <VStack key={`col-${week.weekStart}`} spacing={BOX_SPACING}>
              {week.days.map((day) => (
                <RoundedRectangle
                  cornerRadius={BOX_CORNER_RADIUS}
                  key={day.date}
                  modifiers={[
                    foregroundStyle(
                      day.completed ? APP_ACCENT_COLOR : MISSED_COLOR
                    ),
                    frame({ height: BOX_HEIGHT, width: BOX_WIDTH }),
                    opacity(day.inRange ? 1 : EMPTY_CELL_OPACITY),
                  ]}
                />
              ))}
            </VStack>
          ))}
        </HStack>
      </VStack>
    </ScrollView>
  );
}
