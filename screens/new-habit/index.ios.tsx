import { Stack } from "expo-router";
import { HabitForm } from "../../components/habit-form";
import { APP_ACCENT_COLOR } from "../../lib/app-colors";
import { useAddHabit, useHeaderSubmit } from "../../lib/screen-hooks";

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
        options={{
          headerLargeTitleEnabled: false,
          title: "New Habit",
        }}
      />
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
      <HabitForm
        autoFocusName
        initialName=""
        onSavingChange={setIsSaving}
        onSubmit={handleSubmit}
        onSubmitReady={handleSubmitReady}
        showSubmitSection={false}
        submitErrorTitle="Unable to add habit"
        submitLabel="Add Habit"
      />
    </>
  );
}
