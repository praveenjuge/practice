#!/usr/bin/env bash
# Archives the iOS app with Xcode and uploads it to App Store Connect.
# Uses the Apple account signed in to Xcode and automatic signing.
set -euo pipefail

cd "$(dirname "$0")/.."

# CocoaPods crashes under Ruby 4 without a UTF-8 locale.
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
# Never bake .env.local (the localhost API) into a store build.
export EXPO_NO_DOTENV=1

ARCHIVE_PATH="build/Practice.xcarchive"

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
  -exportOptionsPlist release/ExportOptions.plist \
  -exportPath build/export \
  -allowProvisioningUpdates
