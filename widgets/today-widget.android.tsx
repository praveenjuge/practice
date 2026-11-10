import {
  Column,
  Row,
  Spacer,
  Text,
  TextButton,
} from "@expo/ui/jetpack-compose";
import {
  background,
  cornerRadius,
  fillMaxSize,
  fillMaxWidth,
  paddingAll,
} from "@expo/ui/jetpack-compose/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";
import { EMPTY_WIDGET_PROPS, type TodayWidgetProps } from "./types";

// Android home screen widget: today's habits as tappable rows. A tap updates
// the widget's own props; the app syncs `changed` habits next time it runs.
// Widget code runs in an isolated runtime, so everything it uses is declared
// inside the function.
const TodayWidget = (
  props: TodayWidgetProps,
  environment: WidgetEnvironment
) => {
  "widget";
  const isDark = environment.colorScheme === "dark";
  const accent = "#34C759";
  const surface = isDark ? "#1C1B1F" : "#FFFFFF";
  const primaryText = isDark ? "#E6E1E5" : "#1C1B1F";
  const secondaryText = isDark ? "#A8A5AD" : "#6B6870";
  const container = [fillMaxSize(), background(surface), cornerRadius(24)];

  if (!props.signedIn || props.habits.length === 0) {
    return (
      <Column modifiers={[...container, paddingAll(16)]}>
        <Text color={primaryText} style={{ typography: "titleMedium" }}>
          Practice
        </Text>
        <Text color={secondaryText} style={{ typography: "bodySmall" }}>
          {props.signedIn ? "Add a habit to see it here." : "Sign in to start."}
        </Text>
      </Column>
    );
  }

  const doneCount = props.habits.filter((habit) => habit.done).length;

  return (
    <Column modifiers={[...container, paddingAll(12)]}>
      <Row modifiers={[fillMaxWidth(), paddingAll(4)]}>
        <Text color={primaryText} style={{ typography: "titleMedium" }}>
          Today
        </Text>
        <Spacer modifiers={[fillMaxWidth()]} />
        <Text color={accent} style={{ typography: "titleSmall" }}>
          {`${doneCount}/${props.habits.length}`}
        </Text>
      </Row>
      {props.habits.slice(0, 6).map((habit) => (
        <TextButton
          key={habit.id}
          modifiers={[fillMaxWidth()]}
          // biome-ignore lint/performance/noJsxPropsBind: widget layouts can't use hooks; the runtime stores what this returns
          onClick={() => ({
            habits: props.habits.map((item) =>
              item.id === habit.id
                ? { ...item, changed: true, done: !item.done }
                : item
            ),
          })}
        >
          <Text
            color={habit.done ? secondaryText : primaryText}
            maxLines={1}
            style={{ typography: "bodyLarge" }}
          >
            {`${habit.done ? "✓" : "○"}  ${habit.name}`}
          </Text>
        </TextButton>
      ))}
    </Column>
  );
};

export default createWidget("TodayWidget", TodayWidget, EMPTY_WIDGET_PROPS);
