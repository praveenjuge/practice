import { Stack } from "expo-router";
import { Platform } from "react-native";
import { HabitForm } from "../../components/habit-form";
import { APP_ACCENT_COLOR } from "../../lib/app-colors";
import { useAddHabit, useHeaderSubmit } from "../../lib/screen-hooks";

// iOS saves from a Done button in the sheet's toolbar; Android keeps the
// Material save button at the end of the form.
const isIOS = Platform.OS === "ios";

export default function NewHabitScreen() {
  const handleSubmit = useAddHabit();
  const {
    handleHeaderSubmit,
    handleSubmitReady,
    isHeaderDisabled,
    setIsSaving,
  } = useHeaderSubmit();

  return (
    <>
      <Stack.Screen
        options={{ headerLargeTitleEnabled: false, title: "New Habit" }}
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
        autoFocusName
        initialName=""
        onSavingChange={setIsSaving}
        onSubmit={handleSubmit}
        onSubmitReady={handleSubmitReady}
        showSubmitSection={!isIOS}
        submitErrorTitle="Unable to add habit"
        submitLabel="Add Habit"
      />
    </>
  );
}
