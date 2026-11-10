import { Button, HStack, Image, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import {
  buttonStyle,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  padding,
  widgetURL,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";
import { PlatformColor } from "react-native";
import { EMPTY_WIDGET_PROPS, type TodayWidgetProps } from "./types";

// Home screen widget: today's habits, each with a check-in button. A press
// updates the widget's own props; the app syncs `changed` habits next time
// it runs. Widget code runs in an isolated runtime, so everything it uses is
// declared inside the function.
const TodayWidget = (
  props: TodayWidgetProps,
  environment: WidgetEnvironment
) => {
  "widget";
  const accent = "#34C759";
  const background = containerBackground(
    PlatformColor("systemBackground"),
    "widget"
  );
  const family = environment.widgetFamily;
  // Rows that fit under the header; small and medium share a height.
  const isLarge = family === "systemLarge";
  const rowLimit = isLarge ? 8 : 4;

  if (!props.signedIn || props.habits.length === 0) {
    return (
      <VStack
        alignment="leading"
        modifiers={[background, widgetURL("practice://")]}
        spacing={6}
      >
        <Image color={accent} size={28} systemName="checkmark.circle.fill" />
        <Text modifiers={[font({ textStyle: "headline" })]}>Practice</Text>
        <Text
          modifiers={[
            font({ textStyle: "footnote" }),
            foregroundStyle({ style: "secondary", type: "hierarchical" }),
          ]}
        >
          {props.signedIn ? "Add a habit to see it here." : "Sign in to start."}
        </Text>
      </VStack>
    );
  }

  const doneCount = props.habits.filter((habit) => habit.done).length;
  const shown = props.habits.slice(0, rowLimit);

  return (
    <VStack
      alignment="leading"
      modifiers={[
        background,
        widgetURL("practice://"),
        // Pin to the top so the header is never clipped.
        frame({
          alignment: "topLeading",
          maxHeight: Number.POSITIVE_INFINITY,
          maxWidth: Number.POSITIVE_INFINITY,
        }),
      ]}
      spacing={isLarge ? 8 : 6}
    >
      <HStack>
        <Text modifiers={[font({ textStyle: "headline" })]}>Today</Text>
        <Spacer />
        <Text
          modifiers={[
            font({ textStyle: "subheadline", weight: "semibold" }),
            foregroundStyle(accent),
          ]}
        >
          {`${doneCount}/${props.habits.length}`}
        </Text>
      </HStack>
      {shown.map((habit) => (
        <Button
          key={habit.id}
          modifiers={[buttonStyle("plain")]}
          // biome-ignore lint/performance/noJsxPropsBind: widget layouts can't use hooks; the runtime stores what this returns
          onPress={() => ({
            habits: props.habits.map((item) =>
              item.id === habit.id
                ? { ...item, changed: true, done: !item.done }
                : item
            ),
          })}
          target={habit.id}
        >
          <HStack
            modifiers={[frame({ maxWidth: Number.POSITIVE_INFINITY })]}
            spacing={8}
          >
            <Image
              color={habit.done ? accent : "#C7C7CC"}
              size={20}
              systemName={habit.done ? "checkmark.circle.fill" : "circle"}
            />
            <Text
              modifiers={[
                font({ textStyle: "subheadline" }),
                lineLimit(1),
                foregroundStyle({
                  style: habit.done ? "secondary" : "primary",
                  type: "hierarchical",
                }),
              ]}
            >
              {habit.name}
            </Text>
            <Spacer />
          </HStack>
        </Button>
      ))}
      {isLarge && props.habits.length > shown.length ? (
        <Text
          modifiers={[
            font({ textStyle: "caption" }),
            foregroundStyle({ style: "secondary", type: "hierarchical" }),
            padding({ top: 2 }),
          ]}
        >
          {`+${props.habits.length - shown.length} more`}
        </Text>
      ) : null}
    </VStack>
  );
};

export default createWidget("TodayWidget", TodayWidget, EMPTY_WIDGET_PROPS);
