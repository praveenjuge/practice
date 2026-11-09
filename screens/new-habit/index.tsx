import { HabitFormScreen } from "../../components/web/habit-form-screen";
import { Shell } from "../../components/web/shell";

export default function NewHabitScreen() {
  return (
    <Shell title="New Habit">
      <HabitFormScreen />
    </Shell>
  );
}
