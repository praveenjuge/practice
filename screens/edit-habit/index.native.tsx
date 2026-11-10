import { FieldGroup, Host, ListItem } from "@expo/ui";
import { Stack } from "expo-router";
import { Platform } from "react-native";
import { HabitForm } from "../../components/habit-form";
import { APP_ACCENT_COLOR, HOST_THEME } from "../../lib/app-colors";
import { useEditHabit, useHeaderSubmit } from "../../lib/screen-hooks";

// iOS saves from a Done button in the sheet's toolbar; Android keeps the
// Material save button at the end of the form.
const isIOS = Platform.OS === "ios";

export default function EditHabitScreen() {
  const { habit, handleSubmit } = useEditHabit();
  const {
    handleHeaderSubmit,
    handleSubmitReady,
    isHeaderDisabled,
    setIsSaving,
  } = useHeaderSubmit();

  if (!habit) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Habit" }} />
        <Host {...HOST_THEME} style={{ flex: 1 }}>
          <FieldGroup>
            <FieldGroup.Section>
              <ListItem supportingText="This habit no longer exists.">
                Not found
              </ListItem>
            </FieldGroup.Section>
          </FieldGroup>
        </Host>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{ headerLargeTitleEnabled: false, title: "Edit Habit" }}
      />
      {isIOS ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            accessibilityLabel="Save"
            disabled={isHeaderDisabled}
            icon="checkmark"
            onPress={handleHeaderSubmit}
            tintColor={APP_ACCENT_COLOR}
            variant="done"
          />
        </Stack.Toolbar>
      ) : null}
      <HabitForm
        initialCategoryId={habit.categoryId}
        initialName={habit.name}
        onSavingChange={setIsSaving}
        onSubmit={handleSubmit}
        onSubmitReady={handleSubmitReady}
        showSubmitSection={!isIOS}
        submitErrorTitle="Unable to update habit"
        submitLabel="Save Changes"
      />
    </>
  );
}
