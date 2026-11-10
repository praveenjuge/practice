// Adds the Check In control (iOS 18 Control Center / Lock Screen) to the
// widget extension that expo-widgets generates. expo-widgets has no control
// support, so this merges the control and its shared storage helper into the
// extension's generated index.swift, which is already in the target, and
// registers the control in the widget bundle.
//
// List this plugin before "expo-widgets" in app.config.ts: mods run in reverse
// order, so this then runs after expo-widgets has written its files.
const fs = require("node:fs");
const path = require("node:path");
const { withDangerousMod } = require("expo/config-plugins");

const TARGET_NAME = "ExpoWidgetsTarget";
const SOURCES = [
  "widgets/ios/CheckInControl.swift",
  "app-intents/WidgetCheckIns.swift",
];
const IMPORT_RE = /^(?:@preconcurrency |internal |public )?import .+$/gmu;
const BUNDLE_BODY = "var body: some Widget {";
const CONTROL_ENTRY = `if #available(iOS 18.0, *) {
      CheckInControl()
    }`;

const splitImports = (source) => ({
  body: source.replace(IMPORT_RE, "").trim(),
  imports: source.match(IMPORT_RE) ?? [],
});

module.exports = (config) =>
  withDangerousMod(config, [
    "ios",
    (modConfig) => {
      const { platformProjectRoot, projectRoot } = modConfig.modRequest;
      const indexPath = path.join(
        platformProjectRoot,
        TARGET_NAME,
        "index.swift"
      );
      if (!fs.existsSync(indexPath)) {
        throw new Error(
          `${indexPath} not found. List with-check-in-control before expo-widgets in app.config.ts.`
        );
      }
      const index = splitImports(fs.readFileSync(indexPath, "utf8"));
      if (!index.body.includes(BUNDLE_BODY)) {
        throw new Error(
          "expo-widgets changed its generated index.swift; update with-check-in-control."
        );
      }
      const extras = SOURCES.map((file) =>
        splitImports(fs.readFileSync(path.join(projectRoot, file), "utf8"))
      );
      const imports = new Set([
        ...index.imports,
        ...extras.flatMap((extra) => extra.imports),
      ]);
      const bundle = index.body.replace(
        BUNDLE_BODY,
        `${BUNDLE_BODY}\n    ${CONTROL_ENTRY}`
      );
      const merged = [
        [...imports].join("\n"),
        bundle,
        ...extras.map((extra) => extra.body),
      ].join("\n\n");
      fs.writeFileSync(indexPath, `${merged}\n`);
      return modConfig;
    },
  ]);
