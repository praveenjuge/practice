import {
  Button,
  Host,
  HStack,
  Image,
  List,
  Section,
  Spacer,
  Text,
} from "@expo/ui/swift-ui";
import { foregroundStyle, tint } from "@expo/ui/swift-ui/modifiers";
import { Stack } from "expo-router";
import { HabitStreakHistory } from "../../components/habit-streak-history";
import { APP_ACCENT_COLOR, HOST_THEME } from "../../lib/app-colors";
import { useHabitDetail, useHabitIdParam } from "../../lib/habits-store";
import { useHabitDetailActions } from "../../lib/screen-hooks";

const secondaryStyle = foregroundStyle({
  style: "secondary",
  type: "hierarchical",
});

export default function HabitDetailsScreen() {
  const result = useHabitDetail(useHabitIdParam());
  const habit = result.status === "ready" ? result.detail : undefined;
  const { handleDelete, handleEdit, handleToggle } =
    useHabitDetailActions(habit);

  if (result.status === "loading") {
    return <Stack.Screen options={{ title: "" }} />;
  }

  if (!habit) {
    return (
      <>
        <Stack.Screen options={{ title: "Habit" }} />
        <Host {...HOST_THEME} style={{ flex: 1 }}>
          <List>
            <HStack>
              <Text>Not found</Text>
              <Spacer />
              <Text
                modifiers={[
                  foregroundStyle({
                    style: "secondary",
                    type: "hierarchical",
                  }),
                ]}
              >
                This habit no longer exists
              </Text>
            </HStack>
          </List>
        </Host>
      </>
    );
  }

  const { checkedToday, history, stats } = habit;

  return (
    <>
      <Stack.Screen
        options={{ headerBackButtonDisplayMode: "minimal", title: habit.name }}
      />
      <Host {...HOST_THEME} style={{ flex: 1 }}>
        <List>
          <Section title="Streaks">
            <HStack>
              <Text>Current</Text>
              <Spacer />
              <Text
                modifiers={[secondaryStyle]}
              >{`${stats.currentStreak}`}</Text>
            </HStack>
            <HStack>
              <Text>Highest</Text>
              <Spacer />
              <Text modifiers={[secondaryStyle]}>{`${stats.bestStreak}`}</Text>
            </HStack>
          </Section>
          <Section title="Progress">
            <HStack>
              <Text>Total check-ins</Text>
              <Spacer />
              <Text
                modifiers={[secondaryStyle]}
              >{`${stats.totalCheckins}`}</Text>
            </HStack>
            <HStack>
              <Text>Last check-in</Text>
              <Spacer />
              <Text modifiers={[secondaryStyle]}>
                {stats.lastCheckin ?? "Never"}
              </Text>
            </HStack>
          </Section>
          <Section title="History">
            <HabitStreakHistory weeks={history} />
          </Section>
          <Section title="Actions">
            <Button modifiers={[tint(APP_ACCENT_COLOR)]} onPress={handleToggle}>
              <HStack>
                <Text>
                  {checkedToday ? "Mark as Incomplete" : "Mark as Complete"}
                </Text>
                <Spacer />
              </HStack>
            </Button>
            <Button modifiers={[tint(APP_ACCENT_COLOR)]} onPress={handleEdit}>
              <HStack>
                <Text>Edit habit</Text>
                <Spacer />
                <Image color="secondary" size={14} systemName="chevron.right" />
              </HStack>
            </Button>
            {/** biome-ignore lint/a11y/useValidAriaRole: <this is swift> */}
            <Button onPress={handleDelete} role="destructive">
              <HStack>
                <Text>Delete habit</Text>
                <Spacer />
                <Image color="secondary" size={14} systemName="chevron.right" />
              </HStack>
            </Button>
          </Section>
        </List>
      </Host>
    </>
  );
}
