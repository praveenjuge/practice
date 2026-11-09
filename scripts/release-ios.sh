#!/usr/bin/env bash
# Archives the iOS app with Xcode and uploads it to App Store Connect.
# Uses the Apple account signed in to Xcode and automatic signing.
set -euo pipefail

cd "$(dirname "$0")/.."

# CocoaPods crashes under Ruby 4 without a UTF-8 locale.
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
# Never bake .env.local (the localhost API) into a store build.
export EXPO_NO_DOTENV=1

# The export uploads straight to App Store Connect (with dSYMs), so the
# archive is only needed while this script runs.
BUILD_DIR="$(mktemp -d -t practice-release)"
trap 'rm -rf "$BUILD_DIR"' EXIT
ARCHIVE_PATH="$BUILD_DIR/Practice.xcarchive"

bunx expo prebuild --platform ios --clean
xcodebuild \
  -workspace ios/Practice.xcworkspace \
  -scheme Practice \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  archive
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist scripts/ExportOptions.plist \
  -exportPath "$BUILD_DIR/export" \
  -allowProvisioningUpdates
