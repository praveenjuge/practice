import { Row, ScrollView, Spacer } from "@expo/ui";
import { APP_ACCENT_COLOR } from "./app-colors";
import type { RollingWeekDay } from "./habits-store";

const BOX_WIDTH = 16;
const BOX_HEIGHT = 16;
const BOX_CORNER_RADIUS = 3;
const BOX_SPACING = 4;
const MISSED_COLOR = "#d8dde4";

interface WeeklyStreakBoxesProps {
  days: RollingWeekDay[];
  onPress: () => void;
}

export function WeeklyStreakBoxes({ days, onPress }: WeeklyStreakBoxesProps) {
  return (
    <ScrollView
      direction="horizontal"
      onPress={onPress}
      showsIndicators={false}
    >
      <Row spacing={BOX_SPACING}>
        {days.map((day) => (
          <Spacer
            key={day.date}
            style={{
              backgroundColor: day.completed ? APP_ACCENT_COLOR : MISSED_COLOR,
              borderRadius: BOX_CORNER_RADIUS,
              height: BOX_HEIGHT,
              width: BOX_WIDTH,
            }}
          />
        ))}
      </Row>
    </ScrollView>
  );
}
