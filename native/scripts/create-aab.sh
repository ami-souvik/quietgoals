#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting Android AAB Release Build..."

# Clean native build folders to prevent CMake cache issues
echo "🧹 Cleaning native caches..."
rm -rf android/app/.cxx android/app/build

# Navigate to android directory
cd android

# Clean previous builds
echo "🧹 Cleaning previous builds..."
./gradlew clean

# Build release AAB
echo "📦 Building release App Bundle (AAB)..."
./gradlew bundleRelease

echo "✅ Build Successful!"

# Path to the generated AAB
AAB_PATH="app/build/outputs/bundle/release/app-release.aab"

if [ -f "$AAB_PATH" ]; then
    echo "📍 Your AAB is ready at: android/$AAB_PATH"
    # Get absolute path for convenience
    ABS_PATH=$(realpath "$AAB_PATH")
    echo "🔗 Absolute path: $ABS_PATH"
else
    echo "❌ Error: AAB file was not found at expected location: $AAB_PATH"
    exit 1
fi
