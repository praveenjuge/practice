import { Icon } from "@expo/ui";

export const ADD_ICON = Icon.select({
  android: import("@expo/material-symbols/add.xml"),
  ios: "plus",
});

export const CHECK_ICON = Icon.select({
  android: import("@expo/material-symbols/check_circle.xml"),
  ios: "checkmark.circle.fill",
});

export const CIRCLE_ICON = Icon.select({
  android: import("@expo/material-symbols/radio_button_unchecked.xml"),
  ios: "circle",
});

export const CHEVRON_RIGHT_ICON = Icon.select({
  android: import("@expo/material-symbols/chevron_right.xml"),
  ios: "chevron.right",
});

export const DELETE_ICON = Icon.select({
  android: import("@expo/material-symbols/delete.xml"),
  ios: "trash",
});

export const EDIT_ICON = Icon.select({
  android: import("@expo/material-symbols/edit.xml"),
  ios: "pencil",
});
