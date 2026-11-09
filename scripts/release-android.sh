#!/usr/bin/env bash
# Builds a signed Android App Bundle for Google Play.
# The upload key's settings live in ~/.gradle/gradle.properties as
# PRACTICE_UPLOAD_STORE_FILE, PRACTICE_UPLOAD_KEY_ALIAS,
# PRACTICE_UPLOAD_STORE_PASSWORD and PRACTICE_UPLOAD_KEY_PASSWORD.
set -euo pipefail

cd "$(dirname "$0")/.."

# Never bake .env.local (the localhost API) into a store build.
export EXPO_NO_DOTENV=1
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"

PROPS="$HOME/.gradle/gradle.properties"
read_prop() {
  grep -E "^$1=" "$PROPS" | tail -1 | cut -d= -f2-
}

bunx expo prebuild --platform android --clean
(
  cd android
  ./gradlew bundleRelease \
    -Pandroid.injected.signing.store.file="$(read_prop PRACTICE_UPLOAD_STORE_FILE)" \
    -Pandroid.injected.signing.store.password="$(read_prop PRACTICE_UPLOAD_STORE_PASSWORD)" \
    -Pandroid.injected.signing.key.alias="$(read_prop PRACTICE_UPLOAD_KEY_ALIAS)" \
    -Pandroid.injected.signing.key.password="$(read_prop PRACTICE_UPLOAD_KEY_PASSWORD)"
)

echo "Built android/app/build/outputs/bundle/release/app-release.aab"
