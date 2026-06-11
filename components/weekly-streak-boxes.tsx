import { HStack, RoundedRectangle, ScrollView } from "@expo/ui/swift-ui";
import {
  defaultScrollAnchor,
  foregroundStyle,
  frame,
} from "@expo/ui/swift-ui/modifiers";
import { PlatformColor } from "react-native";
import { APP_ACCENT_COLOR } from "./app-colors";
import type { RollingWeekDay } from "./habits-store";

const BOX_WIDTH = 16;
const BOX_HEIGHT = 16;
const BOX_CORNER_RADIUS = 4;
const BOX_SPACING = 4;
const MISSED_COLOR = PlatformColor("tertiarySystemFill") as unknown as string;

interface WeeklyStreakBoxesProps {
  days: RollingWeekDay[];
}

export function WeeklyStreakBoxes({ days }: WeeklyStreakBoxesProps) {
  return (
    <ScrollView
      axes="horizontal"
      modifiers={[defaultScrollAnchor("trailing")]}
      showsIndicators={false}
    >
      <HStack spacing={BOX_SPACING}>
        {days.map((day) => (
          <RoundedRectangle
            cornerRadius={BOX_CORNER_RADIUS}
            key={day.date}
            modifiers={[
              foregroundStyle(day.completed ? APP_ACCENT_COLOR : MISSED_COLOR),
              frame({ height: BOX_HEIGHT, width: BOX_WIDTH }),
            ]}
          />
        ))}
      </HStack>
    </ScrollView>
  );
}
