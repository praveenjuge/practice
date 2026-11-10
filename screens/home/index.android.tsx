import { Host, Icon, List, ListItem } from "@expo/ui";
import { DropdownMenu, DropdownMenuItem, Text } from "@expo/ui/jetpack-compose";
import { combinedClickable } from "@expo/ui/jetpack-compose/modifiers";
import { router, Stack } from "expo-router";
import { memo, useCallback, useState } from "react";
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

const UNCHECKED_COLOR = "#9aa0a6";
const DANGER_COLOR = "#B3261E";
const ROW_HEIGHT = 72;
const openNewHabit = () => router.push("/habit/new");
const keyExtractor = (habit: Habit) => habit.id;

interface HabitRowProps {
  habit: Habit;
  onDelete: (habit: Habit) => void;
  onToggle: (habit: Habit) => void;
}

// Tap opens the habit; long-press opens a menu of quick actions.
const HabitRow = memo(function HabitRowContent({
  habit,
  onDelete,
  onToggle,
}: HabitRowProps) {
  const { checkedToday } = habit;
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const handleOpen = useCallback(
    () => router.push(`/habit/${habit.id}`),
    [habit.id]
  );
  const handleToggle = useCallback(() => {
    setMenuOpen(false);
    onToggle(habit);
  }, [habit, onToggle]);
  const handleEdit = useCallback(() => {
    setMenuOpen(false);
    router.push(`/habit/edit/${habit.id}`);
  }, [habit.id]);
  const handleDelete = useCallback(() => {
    setMenuOpen(false);
    onDelete(habit);
  }, [habit, onDelete]);

  return (
    <DropdownMenu expanded={menuOpen} onDismissRequest={closeMenu}>
      <DropdownMenu.Trigger>
        <ListItem
          leading={
            <Icon
              accessibilityLabel={
                checkedToday ? "Mark incomplete" : "Mark complete"
              }
              color={checkedToday ? APP_ACCENT_COLOR : UNCHECKED_COLOR}
              name={checkedToday ? CHECK_ICON : CIRCLE_ICON}
              onPress={handleToggle}
              size={24}
            />
          }
          modifiers={[
            combinedClickable({
              onClick: handleOpen,
              onLongClick: () => setMenuOpen(true),
            }),
          ]}
          supportingText={<WeeklyStreakBoxes days={habit.recentDays} />}
        >
          {habit.name}
        </ListItem>
      </DropdownMenu.Trigger>
      <DropdownMenu.Items>
        <DropdownMenuItem onClick={handleToggle}>
          <DropdownMenuItem.Text>
            <Text>{checkedToday ? "Mark incomplete" : "Check in"}</Text>
          </DropdownMenuItem.Text>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit}>
          <DropdownMenuItem.Text>
            <Text>Edit</Text>
          </DropdownMenuItem.Text>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete}>
          <DropdownMenuItem.Text>
            <Text color={DANGER_COLOR}>Delete</Text>
          </DropdownMenuItem.Text>
        </DropdownMenuItem>
      </DropdownMenu.Items>
    </DropdownMenu>
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
            onChangeText: handleSearch,
            placeholder: "Search habits",
          },
          headerShown: true,
          title: "Practice",
        }}
      />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          accessibilityLabel="New habit"
          icon={ADD_TOOLBAR_ICON}
          onPress={openNewHabit}
        />
        <Stack.Toolbar.Menu
          accessibilityLabel="Account"
          icon={ACCOUNT_MENU_ICON}
          title={email}
        >
          <Stack.Toolbar.MenuAction onPress={confirmSignOut}>
            Sign Out
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction destructive onPress={confirmDeleteAccount}>
            Delete Account
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      <Host {...HOST_THEME} style={{ flex: 1 }}>
        <List onRefresh={handleRefresh}>
          {isLoaded && filteredHabits.length === 0 ? (
            <ListItem
              leading={
                <Icon color={APP_ACCENT_COLOR} name={ADD_ICON} size={24} />
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
