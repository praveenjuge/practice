import { Host, Icon, List, ListItem } from "@expo/ui";
import {
  Button,
  ContextMenu,
  HStack,
  SwipeActions,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  buttonStyle,
  contentShape,
  foregroundStyle,
  frame,
  layoutPriority,
  shapes,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { router, Stack } from "expo-router";
import { memo, useCallback } from "react";
import { WeeklyStreakBoxes } from "../../components/weekly-streak-boxes";
import {
  ACCOUNT_MENU_ICON,
  ADD_TOOLBAR_ICON,
  useAccountActions,
} from "../../lib/account-actions";
import { APP_ACCENT_COLOR, HOST_THEME } from "../../lib/app-colors";
import { type Habit, useHabits } from "../../lib/habits-store";
import { ADD_ICON, CHECK_ICON, CIRCLE_ICON } from "../../lib/native-icons";
import {
  useDeleteHabit,
  useHabitSearch,
  useToggleHabit,
} from "../../lib/screen-hooks";
import { useConfirmDialog } from "../../lib/use-confirm-dialog";

const UNCHECKED_COLOR = "#c7c7cc";
const ROW_HEIGHT = 64;
const openNewHabit = () => router.push("/habit/new");
const keyExtractor = (habit: Habit) => habit.id;
interface HabitRowProps {
  habit: Habit;
  onDelete: (habit: Habit) => void;
  onToggle: (habit: Habit) => void;
}

const HabitRow = memo(function HabitRowContent({
  habit,
  onDelete,
  onToggle,
}: HabitRowProps) {
  const { checkedToday } = habit;
  const iconColor = checkedToday ? APP_ACCENT_COLOR : UNCHECKED_COLOR;
  const toggleLabel = checkedToday ? "Mark Incomplete" : "Check In";
  const handleOpen = useCallback(
    () => router.push(`/habit/${habit.id}`),
    [habit.id]
  );
  const handleEdit = useCallback(
    () => router.push(`/habit/edit/${habit.id}`),
    [habit.id]
  );
  const handleToggle = useCallback(() => onToggle(habit), [habit, onToggle]);
  const handleDelete = useCallback(() => onDelete(habit), [habit, onDelete]);

  return (
    <SwipeActions>
      <ContextMenu>
        <ContextMenu.Items>
          <Button
            label={toggleLabel}
            onPress={handleToggle}
            systemImage={checkedToday ? "circle" : "checkmark.circle"}
          />
          <Button label="Edit" onPress={handleEdit} systemImage="pencil" />
          {/* biome-ignore lint/a11y/useValidAriaRole: SwiftUI button role, not ARIA */}
          <Button
            label="Delete"
            onPress={handleDelete}
            role="destructive"
            systemImage="trash"
          />
        </ContextMenu.Items>
        <ContextMenu.Trigger>
          <Button modifiers={[buttonStyle("plain")]} onPress={handleOpen}>
            <HStack
              alignment="center"
              modifiers={[
                contentShape(shapes.rectangle()),
                frame({ maxWidth: Number.POSITIVE_INFINITY }),
              ]}
              spacing={12}
            >
              <Icon
                accessibilityLabel={
                  checkedToday ? "Mark incomplete" : "Mark complete"
                }
                color={iconColor}
                modifiers={[foregroundStyle(iconColor)]}
                name={checkedToday ? CHECK_ICON : CIRCLE_ICON}
                onPress={handleToggle}
                size={22}
              />
              <VStack
                alignment="leading"
                modifiers={[
                  frame({ maxWidth: Number.POSITIVE_INFINITY }),
                  layoutPriority(1),
                ]}
                spacing={2}
              >
                <Text>{habit.name}</Text>
                <WeeklyStreakBoxes days={habit.recentDays} />
              </VStack>
            </HStack>
          </Button>
        </ContextMenu.Trigger>
      </ContextMenu>
      <SwipeActions.Actions edge="leading">
        <Button
          label={toggleLabel}
          modifiers={[tint(checkedToday ? "#8e8e93" : APP_ACCENT_COLOR)]}
          onPress={handleToggle}
          systemImage={checkedToday ? "arrow.uturn.backward" : "checkmark"}
        />
      </SwipeActions.Actions>
      <SwipeActions.Actions allowsFullSwipe={false} edge="trailing">
        {/* biome-ignore lint/a11y/useValidAriaRole: SwiftUI button role, not ARIA */}
        <Button
          label="Delete"
          onPress={handleDelete}
          role="destructive"
          systemImage="trash"
        />
      </SwipeActions.Actions>
    </SwipeActions>
  );
});

export default function HomeScreen() {
  const { habits, isLoaded, refresh } = useHabits();
  const { confirm, dialog } = useConfirmDialog();
  const { confirmDeleteAccount, confirmSignOut, email } =
    useAccountActions(confirm);
  const { filteredHabits, handleSearch, trimmedSearchQuery } =
    useHabitSearch(habits);
  const handleToggle = useToggleHabit();
  const handleDelete = useDeleteHabit(confirm);
  const renderRow = useCallback(
    ({ item }: { item: Habit }) => (
      <HabitRow habit={item} onDelete={handleDelete} onToggle={handleToggle} />
    ),
    [handleDelete, handleToggle]
  );
  const handleRefresh = useCallback(
    () => refresh().catch(() => undefined),
    [refresh]
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            hideWhenScrolling: true,
            onChangeText: handleSearch,
            placeholder: "Search habits",
          },
          headerShown: true,
          title: "Practice",
        }}
      />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu
          accessibilityLabel="Account"
          icon={ACCOUNT_MENU_ICON}
          title={email}
        >
          <Stack.Toolbar.MenuAction
            icon="rectangle.portrait.and.arrow.right"
            onPress={confirmSignOut}
          >
            Sign Out
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction
            destructive
            icon="trash"
            onPress={confirmDeleteAccount}
          >
            Delete Account
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
        <Stack.Toolbar.Button
          accessibilityLabel="New habit"
          icon={ADD_TOOLBAR_ICON}
          onPress={openNewHabit}
        />
      </Stack.Toolbar>
      <Host {...HOST_THEME} style={{ flex: 1 }}>
        <List onRefresh={handleRefresh}>
          {isLoaded && filteredHabits.length === 0 ? (
            <ListItem
              leading={
                <Icon color={APP_ACCENT_COLOR} name={ADD_ICON} size={22} />
              }
              onPress={openNewHabit}
              supportingText={
                trimmedSearchQuery
                  ? `No habit matches "${trimmedSearchQuery}".`
                  : "Add your first habit."
              }
            >
              No habits
            </ListItem>
          ) : null}
          <List.ForEach
            data={filteredHabits}
            estimatedItemSize={ROW_HEIGHT}
            keyExtractor={keyExtractor}
          >
            {renderRow}
          </List.ForEach>
        </List>
      </Host>
      {dialog}
    </>
  );
}
