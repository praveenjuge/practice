import { Text } from "@expo/ui";
import type { ReactNode } from "react";
import {
  Pressable,
  type PressableStateCallbackType,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import { DANGER_COLOR, FONT_SUBHEAD, usePalette } from "./palette";

// react-native-web exposes `hovered` / `focused` on the Pressable state
// callback, but the RN types only declare `pressed`. Narrow them here.
interface WebPointerState {
  focused?: boolean;
  hovered?: boolean;
  pressed?: boolean;
}

const pointerState = (state: PressableStateCallbackType): WebPointerState =>
  state as WebPointerState;

interface HoverPressableProps {
  accessibilityLabel?: string;
  children: ReactNode;
  disabled?: boolean;
  focusColor?: string;
  hoverStyle?: ViewStyle;
  onPress?: () => void;
  role?: "button" | "link";
  style?: StyleProp<ViewStyle>;
}

// Sanctioned invisible chrome: a Pressable wrapper that adds a hover
// background and a visible focus ring, since @expo/ui universal components do
// not expose hover/selection styling on web.
export function HoverPressable({
  accessibilityLabel,
  children,
  disabled = false,
  focusColor,
  hoverStyle,
  onPress,
  role = "button",
  style,
}: HoverPressableProps) {
  const palette = usePalette();
  const accent = focusColor ?? palette.accent;
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      role={role}
      style={(state) => {
        const pointer = pointerState(state);
        const focusRing: ViewStyle = { boxShadow: `0 0 0 2px ${accent}` };
        return [
          style,
          pointer.hovered && !disabled
            ? (hoverStyle ?? { backgroundColor: palette.hover })
            : null,
          pointer.focused ? focusRing : null,
        ];
      }}
    >
      {children}
    </Pressable>
  );
}

type AppButtonVariant = "filled" | "outlined";

interface AppButtonProps {
  destructive?: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
}

// Button styled as the iOS skin, built on HoverPressable so hover/focus and
// the accent label color are reliable on web.
export function AppButton({
  destructive = false,
  disabled = false,
  label,
  onPress,
  variant = "filled",
}: AppButtonProps) {
  const palette = usePalette();
  const accent = destructive ? DANGER_COLOR : palette.accent;
  const filled = variant === "filled";
  const variantStyle: ViewStyle = filled
    ? { backgroundColor: accent }
    : { borderColor: accent, borderWidth: 1 };
  const hoverStyle: ViewStyle = filled
    ? { opacity: 0.88 }
    : { backgroundColor: `${accent}1f` };

  return (
    <HoverPressable
      disabled={disabled}
      focusColor={accent}
      hoverStyle={hoverStyle}
      onPress={onPress}
      style={[
        styles.button,
        variantStyle,
        disabled ? styles.buttonDisabled : null,
      ]}
    >
      <Text
        textStyle={{
          color: filled ? "#ffffff" : accent,
          fontSize: FONT_SUBHEAD,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </HoverPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 10,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    userSelect: "none",
  },
  buttonDisabled: { opacity: 0.45 },
});
