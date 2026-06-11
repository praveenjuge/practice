import { Text } from "@expo/ui";
import { Children, Fragment, isValidElement, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { DANGER_COLOR, FONT_BODY, FONT_CAPTION, usePalette } from "./palette";
import { HoverPressable } from "./pointer";

// iOS "grouped inset" section: uppercase caption + a rounded panel whose rows
// are divided by hairline separators. Hand-rolled (rather than FieldGroup) so
// the web rendering is predictable and can host arbitrary children such as the
// history grid. This is the single isolated fallback called out in the plan.
export function InsetSection({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  const palette = usePalette();
  const rows = Children.toArray(children).filter(Boolean);

  return (
    <View style={styles.section}>
      {title ? (
        <Text
          style={styles.caption}
          textStyle={{
            color: palette.secondary,
            fontSize: FONT_CAPTION,
            fontWeight: "600",
            letterSpacing: 0.5,
          }}
        >
          {title.toUpperCase()}
        </Text>
      ) : null}
      <View
        style={[
          styles.panel,
          { backgroundColor: palette.panel, borderColor: palette.border },
        ]}
      >
        {rows.map((child, index) => {
          const key =
            isValidElement(child) && child.key != null
              ? child.key
              : `row-${index}`;
          return (
            <Fragment key={key}>
              {index > 0 ? (
                <View
                  style={[
                    styles.hairline,
                    { backgroundColor: palette.hairline },
                  ]}
                />
              ) : null}
              {child}
            </Fragment>
          );
        })}
      </View>
    </View>
  );
}

export function KeyValueRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const palette = usePalette();
  return (
    <View style={styles.row}>
      <Text textStyle={{ color: palette.text, fontSize: FONT_BODY }}>
        {label}
      </Text>
      <View style={styles.spacer} />
      <Text textStyle={{ color: palette.secondary, fontSize: FONT_BODY }}>
        {value}
      </Text>
    </View>
  );
}

export function ActionRow({
  destructive = false,
  label,
  onPress,
  trailingGlyph,
}: {
  destructive?: boolean;
  label: string;
  onPress: () => void;
  trailingGlyph?: string;
}) {
  const palette = usePalette();
  const color = destructive ? DANGER_COLOR : palette.accent;
  return (
    <HoverPressable
      hoverStyle={{ backgroundColor: palette.hover }}
      onPress={onPress}
      style={styles.row}
    >
      <Text textStyle={{ color, fontSize: FONT_BODY }}>{label}</Text>
      {trailingGlyph ? (
        <>
          <View style={styles.spacer} />
          <Text textStyle={{ color: palette.secondary, fontSize: FONT_BODY }}>
            {trailingGlyph}
          </Text>
        </>
      ) : null}
    </HoverPressable>
  );
}

const styles = StyleSheet.create({
  caption: { paddingBottom: 6, paddingHorizontal: 16 },
  hairline: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  panel: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  section: { width: "100%" },
  spacer: { flex: 1, minWidth: 12 },
});
