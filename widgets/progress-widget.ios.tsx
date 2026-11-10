import { Gauge, HStack, Image, Text, VStack } from "@expo/ui/swift-ui";
import {
  containerBackground,
  font,
  gaugeStyle,
  lineLimit,
  widgetURL,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";
import { EMPTY_WIDGET_PROPS, type TodayWidgetProps } from "./types";

// Lock screen widget: how many of today's habits are done. Tapping opens
// the app; check-ins from the Lock Screen go through the Control Center
// control.
const ProgressWidget = (
  props: TodayWidgetProps,
  environment: WidgetEnvironment
) => {
  "widget";
  const background = containerBackground("clear", "widget");
  const total = props.habits.length;
  const done = props.habits.filter((habit) => habit.done).length;
  const next = props.habits.find((habit) => !habit.done);
  const family = environment.widgetFamily;

  if (family === "accessoryInline") {
    return (
      <Text modifiers={[widgetURL("practice://")]}>
        {total === 0 ? "Practice" : `${done} of ${total} habits done`}
      </Text>
    );
  }

  if (family === "accessoryCircular") {
    return (
      <Gauge
        currentValueLabel={<Text>{`${done}`}</Text>}
        max={Math.max(total, 1)}
        modifiers={[
          gaugeStyle("circularCapacity"),
          background,
          widgetURL("practice://"),
        ]}
        value={done}
      >
        <Image systemName="checkmark" />
      </Gauge>
    );
  }

  let detail = "Add a habit to start";
  if (total > 0) {
    detail = next ? `Next: ${next.name}` : "All done for today";
  }

  return (
    <VStack
      alignment="leading"
      modifiers={[background, widgetURL("practice://")]}
      spacing={2}
    >
      <HStack spacing={4}>
        <Image systemName="checkmark.circle.fill" />
        <Text modifiers={[font({ textStyle: "headline" })]}>
          {`${done}/${total} today`}
        </Text>
      </HStack>
      <Gauge
        max={Math.max(total, 1)}
        modifiers={[gaugeStyle("linearCapacity")]}
        value={done}
      />
      <Text modifiers={[font({ textStyle: "caption" }), lineLimit(1)]}>
        {detail}
      </Text>
    </VStack>
  );
};

export default createWidget(
  "ProgressWidget",
  ProgressWidget,
  EMPTY_WIDGET_PROPS
);
