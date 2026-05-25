import { useLocalSearchParams } from "expo-router";
import { WebHabitForm } from "../web-habits-app";

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const habitId = Array.isArray(id) ? id[0] : id;
  return <WebHabitForm habitId={habitId} />;
}
