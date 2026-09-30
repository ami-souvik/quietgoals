# Quiet Goals

A privacy-first Android app that turns personal goals into calm, minimal wallpapers. No accounts, no notifications, no tracking. Everything stays on your device.

**Play Store:** [com.qurtesy.quietgoals](https://play.google.com/store/apps/details?id=com.qurtesy.quietgoals)

---

## Features

- **Goal wallpapers** — type a goal, pick a mood and layout, set it as your wallpaper
- **4 moods** — Calm, Focused, Grounded, Ambitious (each with its own palette and typography)
- **9 layout variants** — control text position (top / center / bottom) and alignment
- **Background modes** — procedural gradient or a custom image from your gallery
- **Font controls** — size slider and bold toggle per mood's typeface
- **Set wallpaper directly** — Home screen, Lock screen, or both (Android); save to Photos (iOS)
- **Goal history** — past wallpapers are saved automatically; tap any to restore it
- **No backend** — zero network calls, zero accounts, zero analytics

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | React Native 0.81.5 (Bare Workflow via Expo Modules) |
| Language | TypeScript ~5.9 |
| Navigation | React Navigation v7 (Native Stack) |
| Storage | `@react-native-async-storage/async-storage` |
| Image capture | `react-native-view-shot` |
| Wallpaper | `expo-wallpaper-manager` (custom Kotlin module, Android only) |
| Media | `expo-media-library`, `expo-image-picker` |
| Fonts | `expo-font` — Oswald, DancingScript, HostGrotesk, Outfit |
| Icons | `lucide-react-native` |

---

## Project Structure

```
quiet-goals/
├── App.tsx                        # Root — providers + Stack Navigator (navigation only)
├── components/
│   ├── AppContext.tsx             # Global alert state
│   ├── CreatorContext.tsx         # All wallpaper creator state + actions
│   ├── ToastContext.tsx           # Toast notification system
│   ├── HomeView.tsx               # Home screen — history access + create entry
│   ├── CreatorView.tsx            # Goal wallpaper creator screen
│   ├── TodoCreatorView.tsx        # Todo wallpaper creator screen
│   ├── CreatorToolbar.tsx         # Bottom toolbar (save button)
│   ├── CreatorOverlay.tsx         # Tool overlay switcher
│   ├── CustomAlert.tsx            # In-app modal alert
│   ├── Modalize.tsx               # Slide-in modal wrapper
│   ├── Toast.tsx                  # Toast UI component
│   ├── modal/
│   │   └── GoalsHistoryModal.tsx  # History list modal
│   └── tool-overlay/
│       ├── ApplyOverlay.tsx       # Set wallpaper options
│       ├── BgOverlay.tsx          # Background picker
│       ├── FontOverlay.tsx        # Font size + bold controls
│       ├── LayoutOverlay.tsx      # Layout variant picker
│       └── MoodOverlay.tsx        # Mood picker
├── lib/
│   ├── storage.ts                 # AsyncStorage CRUD — active goal, history
│   ├── moods.ts                   # Mood config (palette, typography, gradient)
│   ├── variants.ts                # Layout variant config
│   ├── config.ts                  # Local image config per mood
│   └── types.ts                   # Shared TypeScript types
└── assets/fonts/                  # Embedded custom fonts
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Android Studio with an emulator or physical device
- React Native CLI environment ([official setup guide](https://reactnative.dev/docs/set-up-your-environment))

### Install

```bash
npm install
```

### Run (development)

```bash
npm run android
```

This uninstalls any existing build and runs via Metro bundler.

### Build (release)

```bash
# APK (direct install / sideload)
npm run build:android   # triggers ./scripts/create-apk.sh

# AAB (Play Store submission)
./scripts/create-aab.sh
```

---

## Architecture Notes

- **No Redux, no Zustand.** State is Context-only: `AppContext` (alerts), `CreatorContext` (all creator + history state and actions), `ToastContext` (toasts).
- **`CreatorContext` is the core.** It owns: active goal, history, todo items, the `viewShotRef`, and all wallpaper actions (`saveWallpaper`, `setWallpaper`, `saveTodoGoal`, `restoreGoal`).
- **`App.tsx` is navigation-only.** Font loading + stack navigator. No business logic.
- **All storage goes through `lib/storage.ts`.** Never call AsyncStorage directly from components.
- **No network calls.** The app is fully offline. Background images are bundled via `lib/config.ts`.

---

## Privacy

- No user accounts or login
- No analytics, crash reporters, or tracking SDKs
- No push notifications
- All data (goals, history) stored locally via AsyncStorage and never leaves the device

---

## License

Proprietary — Qurtesy Labs. All rights reserved.
