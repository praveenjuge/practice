import { HabitFormScreen } from "../web/habit-form-screen";
import { Shell } from "../web/shell";

export default function NewHabitScreen() {
  return (
    <Shell title="New Habit">
      <HabitFormScreen />
    </Shell>
  );
}
