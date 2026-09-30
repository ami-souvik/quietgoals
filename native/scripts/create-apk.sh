#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting Android Release Build..."

# Clean native build folders to prevent CMake cache issues
echo "🧹 Cleaning native caches..."
rm -rf android/app/.cxx android/app/build

# Navigate to android directory
cd android

# Clean previous builds
echo "🧹 Cleaning previous builds..."
./gradlew clean --no-daemon

# Build release APK
echo "📦 Building release APK..."
./gradlew assembleRelease --no-daemon --max-workers=2

echo "✅ Build Successful!"

# Path to the generated APK
APK_PATH="app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
    echo "📍 Your APK is ready at: android/$APK_PATH"
    # Get absolute path for convenience
    ABS_PATH=$(realpath "$APK_PATH")
    echo "🔗 Absolute path: $ABS_PATH"
else
    echo "❌ Error: APK file was not found at expected location: $APK_PATH"
    exit 1
fi
