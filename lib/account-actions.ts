import AccountCircleIcon from "@expo/material-symbols/account_circle.xml";
import AddIcon from "@expo/material-symbols/add.xml";
import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { useCallback } from "react";
import { Alert, Platform } from "react-native";
import type { ConfirmRequest } from "../components/confirm-dialog";
import { deleteAccount, signOut, useSession } from "./session";

// Toolbar icons: SF Symbols on iOS, Material Symbol drawables on Android
// (Android toolbar items need an image source).
const isIOS = Platform.OS === "ios";
export const ACCOUNT_MENU_ICON = isIOS
  ? "person.crop.circle"
  : AccountCircleIcon;
export const ADD_TOOLBAR_ICON = isIOS ? "plus" : AddIcon;

const showError = (title: string, error: unknown) => {
  Alert.alert(
    title,
    error instanceof Error ? error.message : "Please try again."
  );
};

// Account actions for the native toolbar menu, confirmed with the native
// dialog from useConfirmDialog.
export function useAccountActions(confirm: (request: ConfirmRequest) => void) {
  const session = useSession();
  const email = session.status === "signedIn" ? session.user.email : "";

  const confirmSignOut = useCallback(() => {
    confirm({
      confirmLabel: "Sign Out",
      message: email ? `You're signed in as ${email}.` : undefined,
      onConfirm: () => {
        signOut().catch((error: unknown) => {
          showError("Couldn't sign out", error);
        });
      },
      title: "Sign out?",
    });
  }, [confirm, email]);

  const confirmDeleteAccount = useCallback(() => {
    confirm({
      confirmLabel: "Delete Account",
      destructive: true,
      message:
        "This permanently deletes your account, habits and check-ins. It can't be undone.",
      onConfirm: () => {
        notificationAsync(NotificationFeedbackType.Warning);
        deleteAccount().catch((error: unknown) => {
          showError("Couldn't delete your account", error);
        });
      },
      title: "Delete your account?",
    });
  }, [confirm]);

  return { confirmDeleteAccount, confirmSignOut, email };
}
