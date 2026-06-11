import { Text } from "@expo/ui";
import { StyleSheet, View } from "react-native";
import { useHabits } from "../habits-store";
import { HabitDetailPane } from "../web/habit-detail-pane";
import { HabitListPane } from "../web/habit-list-pane";
import { FONT_SUBHEAD, usePalette } from "../web/palette";
import { Shell, useIsWide } from "../web/shell";

export default function HomeScreen() {
  const { habits, isLoaded, today } = useHabits();
  const isWide = useIsWide();
  const palette = usePalette();

  if (!isLoaded) {
    return (
      <Shell title="Practice">
        <View style={styles.centered}>
          <Text
            textStyle={{ color: palette.secondary, fontSize: FONT_SUBHEAD }}
          >
            Loading habits…
          </Text>
        </View>
      </Shell>
    );
  }

  return (
    <Shell title="Practice">
      <View style={isWide ? styles.desktop : styles.mobile}>
        <HabitListPane habits={habits} today={today} />
        {isWide ? (
          <View style={styles.detailPane}>
            <HabitDetailPane habit={undefined} />
          </View>
        ) : null}
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  desktop: { flex: 1, flexDirection: "row" },
  detailPane: { flex: 1 },
  mobile: { flex: 1 },
});
