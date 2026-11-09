import { useCallback, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import appIcon from "../../assets/icon.png";
import { signIn } from "../../lib/session";
import {
  WELCOME_FEATURES,
  WELCOME_SUBTITLE,
  WELCOME_TITLE,
} from "../../lib/welcome-copy";
import { DANGER_COLOR, FONT_SUBHEAD, usePalette } from "./palette";
import { AppButton } from "./pointer";

const ICON_SIZE = 72;
// Below this width the card fills the screen like a native welcome screen.
const COMPACT_WIDTH = 520;
const CHECK_GLYPH = "✓";

export function AuthGate() {
  const palette = usePalette();
  const isCompact = useWindowDimensions().width < COMPACT_WIDTH;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = useCallback(() => {
    setBusy(true);
    setError(null);
    signIn()
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error ? reason.message : "Please try again."
        );
      })
      .finally(() => setBusy(false));
  }, []);

  return (
    <View
      style={[
        styles.root,
        isCompact ? styles.rootCompact : null,
        { backgroundColor: isCompact ? palette.panel : palette.page },
      ]}
    >
      <View
        style={[
          styles.card,
          isCompact
            ? styles.cardCompact
            : {
                backgroundColor: palette.panel,
                borderColor: palette.border,
                boxShadow: palette.shadow,
              },
        ]}
      >
        <View style={isCompact ? styles.introCompact : styles.intro}>
          <View style={styles.header}>
            <Image source={appIcon} style={styles.icon} />
            <Text style={[styles.title, { color: palette.text }]}>
              {WELCOME_TITLE}
            </Text>
            <Text style={[styles.subtitle, { color: palette.secondary }]}>
              {WELCOME_SUBTITLE}
            </Text>
          </View>
          <View style={styles.features}>
            {WELCOME_FEATURES.map((feature) => (
              <View key={feature.key} style={styles.feature}>
                <View
                  style={[
                    styles.featureMark,
                    { backgroundColor: palette.accent },
                  ]}
                >
                  <Text style={styles.featureMarkText}>{CHECK_GLYPH}</Text>
                </View>
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: palette.text }]}>
                    {feature.title}
                  </Text>
                  <Text
                    style={[styles.featureDetail, { color: palette.secondary }]}
                  >
                    {feature.detail}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.actions}>
          <AppButton
            disabled={busy}
            label={busy ? "Signing in…" : "Continue"}
            onPress={handleSignIn}
            prominent
          />
          {error ? (
            <Text style={[styles.footnote, { color: DANGER_COLOR }]}>
              {error}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 12 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 28,
    maxWidth: 440,
    padding: 36,
    width: "100%",
  },
  cardCompact: {
    borderWidth: 0,
    flex: 1,
    justifyContent: "center",
    maxWidth: 520,
    padding: 24,
  },
  feature: { alignItems: "flex-start", flexDirection: "row", gap: 14 },
  featureDetail: { fontSize: 14, lineHeight: 19 },
  featureMark: {
    alignItems: "center",
    borderRadius: 12,
    height: 24,
    justifyContent: "center",
    marginTop: -1,
    width: 24,
  },
  featureMarkText: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
  features: { gap: 16 },
  featureText: { flex: 1, gap: 2 },
  featureTitle: { fontSize: FONT_SUBHEAD, fontWeight: "600" },
  footnote: { fontSize: 13, lineHeight: 18, textAlign: "center" },
  header: { alignItems: "center", gap: 8 },
  icon: {
    borderRadius: ICON_SIZE * 0.2237,
    height: ICON_SIZE,
    marginBottom: 8,
    width: ICON_SIZE,
  },
  intro: { gap: 28 },
  introCompact: { flex: 1, gap: 28, justifyContent: "center" },
  root: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  rootCompact: { padding: 0 },
  subtitle: { fontSize: FONT_SUBHEAD, lineHeight: 22, textAlign: "center" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 6 },
});
