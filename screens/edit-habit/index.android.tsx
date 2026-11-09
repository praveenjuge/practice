import { Host, List, ListItem } from "@expo/ui";
import { Stack } from "expo-router";
import { HabitForm } from "../../components/habit-form";
import { HOST_THEME } from "../../lib/app-colors";
import { useEditHabit } from "../../lib/screen-hooks";

export default function EditHabitScreen() {
  const { habit, handleSubmit } = useEditHabit();

  if (!habit) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Habit" }} />
        <Host {...HOST_THEME} style={{ flex: 1 }}>
          <List>
            <ListItem supportingText="This habit no longer exists.">
              Not found
            </ListItem>
          </List>
        </Host>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{ headerLargeTitleEnabled: false, title: "Edit Habit" }}
      />
      <HabitForm
        initialCategoryId={habit.categoryId}
        initialName={habit.name}
        onSubmit={handleSubmit}
        submitErrorTitle="Unable to update habit"
        submitLabel="Save Changes"
      />
    </>
  );
}
