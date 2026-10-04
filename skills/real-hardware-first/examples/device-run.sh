#!/bin/bash
# ./device-run.sh ios <Scheme> <bundle-id> [device name or udid]   build, install, launch with console on a real iPhone/iPad
# ./device-run.sh android <app.apk> <package> [log tag]           install, launch, follow logcat
set -euo pipefail

case "${1:-}" in
  ios)
    SCHEME="$2"; BUNDLE="$3"; DEVICE="${4:-}"
    if [ -z "$DEVICE" ]; then
      xcrun devicectl list devices
      echo "pass a device name or udid from the list above"; exit 1
    fi
    xcodebuild -scheme "$SCHEME" -configuration Debug -destination "platform=iOS,name=$DEVICE" -derivedDataPath build/device -allowProvisioningUpdates build | tail -3
    APP=$(find build/device/Build/Products/Debug-iphoneos -maxdepth 1 -name '*.app' | head -1)
    xcrun devicectl device install app --device "$DEVICE" "$APP"
    xcrun devicectl device process launch --device "$DEVICE" --terminate-existing --console "$BUNDLE"
    ;;
  android)
    APK="$2"; PKG="$3"; TAG="${4:-}"
    adb devices -l
    adb install -r "$APK"
    adb logcat -c
    adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null
    if [ -n "$TAG" ]; then adb logcat -s "$TAG":V AndroidRuntime:E DEBUG:F; else adb logcat --pid="$(adb shell pidof -s "$PKG")"; fi
    ;;
  *)
    sed -n 2,3p "$0"; exit 1 ;;
esac
