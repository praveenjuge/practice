import { HStack, RoundedRectangle } from "@expo/ui/swift-ui";
import {
  accessibilityLabel,
  foregroundStyle,
  frame,
  onTapGesture,
} from "@expo/ui/swift-ui/modifiers";
import { PlatformColor } from "react-native";
import { APP_ACCENT_COLOR } from "./app-colors";
import type { RollingWeekDay } from "./habits-store";

const BOX_WIDTH = 16;
const BOX_HEIGHT = 16;
const BOX_CORNER_RADIUS = 3;
const BOX_SPACING = 4;

const MISSED_COLOR = PlatformColor("tertiarySystemFill") as unknown as string;

interface WeeklyStreakBoxesProps {
  days: RollingWeekDay[];
  onPress: () => void;
}

export function WeeklyStreakBoxes({ days, onPress }: WeeklyStreakBoxesProps) {
  const completedCount = days.reduce(
    (total, day) => (day.completed ? total + 1 : total),
    0
  );
  const missedCount = days.length - completedCount;
  const label = `Last ${days.length} days: ${completedCount} completed, ${missedCount} missed.`;

  return (
    <HStack
      modifiers={[accessibilityLabel(label), onTapGesture(onPress)]}
      spacing={BOX_SPACING}
    >
      {days.map((day) => (
        <RoundedRectangle
          cornerRadius={BOX_CORNER_RADIUS}
          key={day.date}
          modifiers={[
            foregroundStyle(day.completed ? APP_ACCENT_COLOR : MISSED_COLOR),
            frame({ width: BOX_WIDTH, height: BOX_HEIGHT }),
          ]}
        />
      ))}
    </HStack>
  );
}
