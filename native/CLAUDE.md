# CLAUDE.md — Quiet Goals (React Native)

## Project Overview

**Quiet Goals** is a privacy-first Android app that turns personal goals into calm, minimal wallpapers. No accounts, no notifications, no tracking. Everything is local to the device.

- **Play Store:** `com.qurtesy.quietgoals`
- **Repo:** `github.com/ami-souvik/quiet-goals-rn`
- **Developer:** Souvik Dey (ami-souvik) — Qurtesy Labs
- **Status:** Shipped (v1). Active development across 3 expansion tracks.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | React Native 0.81.5 (Bare Workflow via Expo Modules) |
| Language | TypeScript ~5.9 |
| Navigation | React Navigation v7 (Native Stack) |
| Storage | `@react-native-async-storage/async-storage` |
| Image Capture | `react-native-view-shot` |
| Wallpaper | `expo-wallpaper-manager` (custom Kotlin module) |
| SVG Rendering | `react-native-svg` |
| Media | `expo-media-library`, `expo-image-picker` |
| Fonts | `expo-font` (Oswald, DancingScript, HostGrotesk, Outfit) |
| Icons | `lucide-react-native` |
| Build | Bare workflow — `./create-apk.sh` → APK, `./create-aab.sh` → AAB |

**No backend. No API. No auth. All data stays on device.**

---

## Project Structure

```
quiet-goals-rn/
├── App.tsx                  # Root — providers + Stack Navigator
├── index.js                 # Entry point
├── components/
│   ├── AppContext.tsx        # Global app state (alerts etc.)
│   ├── CreatorContext.tsx    # Wallpaper creator state (mood, variant, text, bgMode...)
│   ├── HomeView.tsx          # Home screen — active goal card + history
│   ├── CreatorView.tsx       # Goal wallpaper creator screen
│   ├── TodoCreatorView.tsx   # Todo wallpaper creator screen
│   ├── CustomAlert.tsx       # In-app modal alert
│   └── ToastContext.tsx      # Toast notification system (success/error)
├── lib/
│   ├── storage.ts            # AsyncStorage CRUD — ActiveGoal, history, todos
│   ├── svg.ts                # SVG generation — wallpaper rendering logic
│   ├── moods.ts              # MOODS config — calm, focused, grounded, ambitious
│   └── images.ts             # Mood image fetching logic
├── assets/
│   └── fonts/               # Embedded custom fonts
├── android/                 # Native Android project
├── ios/                     # iOS project (not currently published)
├── patches/                 # patch-package patches
├── app.json                 # Expo config
├── eas.json                 # EAS build config
└── build-apk.sh / create-aab.sh / create-apk.sh
```

---

## Core Data Model

```typescript
// From lib/storage.ts
type ActiveGoal = {
  type: 'goal' | 'todo';
  text: string;                    // Goal text or first todo item
  moodId?: string;                 // 'calm' | 'focused' | 'grounded' | 'ambitious'
  variantId?: string;              // Layout: 'center-center' | 'soft' | 'bold' | 'minimal' | 'subtle'
  fontSizeScale?: number;          // 1.0 default
  bgMode?: 'procedural' | 'image';
  backgroundImage?: string | null; // URI if bgMode === 'image'
  todoItems?: TodoItem[];
  timestamp: number;
};

type TodoItem = {
  id: string;
  text: string;
  checked: boolean;
};
```

**Storage keys (AsyncStorage):**
- `active_goal` — current wallpaper goal
- `goal_history` — array of past `ActiveGoal` objects

---

## Navigation Structure

```
Stack.Navigator
├── Home          → HomeView
├── Creator       → CreatorView (goal wallpaper)
└── TodoCreator   → TodoCreatorView (todo wallpaper)
```

---

## Wallpaper Generation Flow

1. User configures: text + moodId + variantId + bgMode + fontSizeScale + isBold
2. `generateSvg(...)` in `lib/svg.ts` produces SVG XML
3. SVG renders in `CreatorView` via `react-native-svg`
4. Text overlay rendered separately (TextInput over SVG, not inside SVG)
5. `viewShotRef.current.capture()` screenshots the composed view → URI
6. On "Set Wallpaper": `WallpaperManager.setWallpaper({ uri, type })` — type: `'home' | 'lock' | 'both'`
7. On "Save": `MediaLibrary.saveToLibraryAsync(uri)` → Photos

---

## State Management Pattern

- `AppContext` — global: alert/modal state
- `CreatorContext` — creator screen: all wallpaper config fields (moodId, variantId, text, bgMode, backgroundImage, fontSizeScale, isBold, activeTool, loadingImage)
- `ToastContext` — global: toast queue
- Local `useState` in `App.tsx` — history array, todoItems

No Redux, no Zustand. Context-only. Keep it that way unless a feature genuinely requires cross-context reactivity.

---

## Existing Features (v1 — Shipped)

- Goal wallpaper creation with text + mood + layout + background
- Todo wallpaper creation (checklist as wallpaper)
- 4 moods: Calm, Focused, Grounded, Ambitious
- 4 layout variants: Soft, Bold, Subtle, Minimal
- Background modes: procedural gradient OR image (gallery picker OR mood-fetched image)
- Font size scaling slider
- Bold toggle
- Direct wallpaper set: Home / Lock / Both (Android only)
- Save to Photos (Android + iOS)
- History of past wallpapers — tap to restore
- Active goal card on Home screen
- No accounts, no tracking, no backend

---

## Expansion Roadmap

Three active development tracks. All must remain privacy-first and local-only.

---

### Track 1 — Home Screen Widget

**Goal:** Display the active goal as a glanceable Android home screen widget. The wallpaper is passive presence; the widget is interactive presence.

**Scope:**
- `2×1` and `4×1` widget sizes showing `activeGoal.text`
- Widget reads from AsyncStorage — same key as app (`active_goal`)
- Widget theme matches the active goal's `moodId` (color palette sync)
- Tap widget → opens app to Creator screen for that goal
- Widget updates whenever `active_goal` changes in AsyncStorage
- Lock screen widget (Android 13+) as stretch goal

**Technical approach:**
- Use **Jetpack Glance API** (Kotlin) for the widget — do not use the deprecated RemoteViews approach
- Write a native Kotlin `AppWidget` that reads AsyncStorage via a shared file or `react-native-async-storage` key
- Bridge via a new Expo Module or a plain `ReactContextBaseJavaModule` in `android/`
- Widget layout files in `android/src/main/res/layout/`
- Register in `android/src/main/AndroidManifest.xml`

**Files to create/modify:**
- `android/app/src/main/java/.../widget/QuietGoalsWidget.kt`
- `android/app/src/main/res/layout/quiet_goals_widget.xml`
- `android/app/src/main/res/xml/quiet_goals_widget_info.xml`
- `android/app/src/main/AndroidManifest.xml` — register receiver
- `lib/storage.ts` — ensure AsyncStorage writes trigger widget update (via `SharedPreferences` bridge if needed)

**Constraints:**
- Widget must work offline, always
- Do not add a new storage layer — reuse AsyncStorage data
- Widget UI must feel "quiet" — minimal text, mood-tinted background, no clutter

---

### Track 2 — Multi-Goal Library & Rotation System

**Goal:** Let users save multiple goals and optionally auto-rotate the wallpaper, so the app stays relevant over time instead of being a one-and-done tool.

**Scope:**
- **Goal Library screen:** list of all saved goals (not just history — named, persistent)
- Each goal has: `name` (user-set label), all existing `ActiveGoal` fields, `createdAt`, `status: 'active' | 'archived'`
- **Set Active:** tap any saved goal to make it the current wallpaper goal
- **Auto-rotation mode:** toggle that cycles through 2–5 selected goals daily (morning swap on first app open or via WorkManager scheduled task)
- **Archive:** soft-delete — move to archived state, never hard-delete
- **Migration:** existing `goal_history` items surfaced as importable into the library

**New storage keys:**
```typescript
type GoalLibraryItem = {
  id: string;                   // uuid
  name: string;                 // user-defined label e.g. "Ship Quiet Goals widget"
  type: 'goal' | 'todo';
  text: string;
  moodId: string;
  variantId: string;
  fontSizeScale: number;
  isBold: boolean;
  bgMode: 'procedural' | 'image';
  backgroundImage?: string | null;
  todoItems?: TodoItem[];
  status: 'active' | 'archived';
  createdAt: number;
  lastSetAt?: number;
};

type RotationConfig = {
  enabled: boolean;
  goalIds: string[];            // ordered list of goals to rotate through
  intervalHours: number;        // default: 24
  lastRotatedAt?: number;
};
```

**AsyncStorage keys:**
- `goal_library` — `GoalLibraryItem[]`
- `rotation_config` — `RotationConfig`

**Navigation additions:**
```
Stack.Navigator
├── Home
├── Library          → GoalLibraryView   ← NEW
├── Creator
└── TodoCreator
```

**Rotation logic:**
- On app open, check `rotation_config.lastRotatedAt` vs `intervalHours`
- If due: pick next goal in `goalIds` array, call `saveActiveGoal()` + `WallpaperManager.setWallpaper()`
- For background rotation (stretch): use `expo-task-manager` + `expo-background-fetch` or Android `WorkManager`

**Constraints:**
- Migration from old `goal_history` to new `goal_library` must be non-destructive
- No cloud sync — all local
- Rotation never fires notifications — it's silent

---

### Track 3 — Reflection Layer

**Goal:** Add a lightweight, non-gamified check-in system that helps users stay honest about their goals — without streaks, scores, or pressure. This is the brand differentiator.

**Design principles:**
- One question, once a week, per active goal
- No streak counter, no score, no badge
- Responses stored locally, never shown in aggregate
- The goal text can "evolve" — user can edit it inline without losing the thread
- If a goal is stale (set > 30 days ago, no check-in), a soft nudge: "Does this still fit you?"

**Scope:**
- **Weekly check-in prompt** on Home screen (non-blocking card, dismissible): "Did this feel true this week?" → `Yes` / `Not quite` / `It's evolving`
- If "It's evolving" → open goal edit flow with current text pre-filled
- **Private note** per goal: a single text field only the user sees, saved locally
- **Milestone marker:** user can tap "Something shifted today" → saves a `milestone` timestamp on the goal; wallpaper mood subtly shifts for 24h (e.g. add a warm overlay or change variant)
- **Goal age nudge:** if `lastSetAt` > 30 days and no check-in in 7 days → show "Does this still feel true?" on next open

**New data fields** (add to `GoalLibraryItem` or `ActiveGoal`):
```typescript
type GoalReflection = {
  goalId: string;
  weekOf: string;                  // ISO week string e.g. "2026-W24"
  response: 'yes' | 'not_quite' | 'evolving';
  note?: string;
  milestonesAt?: number[];         // timestamps of "something shifted" taps
  createdAt: number;
};
```

**AsyncStorage keys:**
- `reflections` — `GoalReflection[]`
- `goal_notes` — `Record<goalId, string>` (private notes per goal)

**UI placement:**
- Check-in card appears on `HomeView` below the active goal card — subtle, not a modal
- "Add a note" icon on `CreatorView` or the goal detail (pencil icon, opens a bottom sheet)
- Milestone button on `HomeView` active goal card — tap the goal card itself (long press → "Mark a shift")

**Constraints:**
- Zero notifications — check-in is ambient, not pushed
- No analytics, no aggregation shown to user
- Response history is readable by user (simple log view as stretch goal)
- Evolving a goal preserves original text as `originalText` field — never overwrite

---

## Development Guidelines

### Privacy Rules (Non-Negotiable)
- No network calls for user data — ever
- No analytics SDKs (no Firebase, Mixpanel, Amplitude etc.)
- No crash reporters that send PII
- All new storage keys use AsyncStorage — no SQLite, no Realm
- If a feature requires a server, it doesn't belong in this app

### Code Style
- TypeScript strict mode — no `any` unless absolutely unavoidable, add a comment if so
- Functional components only — no class components
- Context over prop-drilling for state that crosses 2+ screens
- Keep `App.tsx` as thin orchestrator — business logic belongs in `lib/` or context files
- Name new lib files by domain: `lib/rotation.ts`, `lib/reflection.ts`, `lib/widget.ts`

### Native Android (Kotlin)
- New Kotlin modules go in `android/app/src/main/java/com.qurtesy.quietgoals/`
- Follow the existing `expo-wallpaper-manager` pattern for any new Expo Module bridges
- Use `patch-package` for any third-party patches — document in `patches/README.md`

### Adding New Screens
1. Add screen component in `components/`
2. Register in `Stack.Navigator` in `App.tsx`
3. Add type to `RootStackParamList` (create this type in `App.tsx` if not already defined)
4. Navigate via typed `navigation.navigate('ScreenName', params)`

### AsyncStorage Conventions
- All reads/writes go through `lib/storage.ts` — do not call AsyncStorage directly from components
- Key naming: `snake_case` strings, e.g. `goal_library`, `rotation_config`
- Always `JSON.stringify` / `JSON.parse` — AsyncStorage is strings only
- Handle null/undefined on reads — storage may be empty on first launch

### Build
```bash
# Dev
npm run android          # uninstalls existing + runs via Expo

# Release
npm run build:android    # triggers create-apk.sh
./create-aab.sh          # for Play Store submission
```

---

## What NOT to Build

- No user accounts or login
- No cloud sync or backup
- No social features or sharing of goals
- No push notifications (ever)
- No streak tracking or gamification
- No ads
- No in-app purchases yet (Pro unlock is on roadmap but not in scope for current tracks)
- No iOS-specific features until Android tracks are complete

---

## Key Dependencies — Notes

| Package | Notes |
|---|---|
| `expo-wallpaper-manager` | Custom Expo module — Kotlin only, Android only. iOS falls back to save-to-photos. |
| `react-native-view-shot` | Used to capture the wallpaper view as a URI before setting/saving. |
| `react-native-svg` | Renders the SVG wallpaper background. Text is overlaid separately (not in SVG). |
| `expo-image-picker` | Gallery picker for custom background images. |
| `patch-package` + `jetifier` | Run automatically via `postinstall`. Don't remove. |

---

## Reference Links

- Play Store: https://play.google.com/store/apps/details?id=com.qurtesy.quietgoals
- Repo: https://github.com/ami-souvik/quiet-goals
- Developer portfolio: https://amisouvik.vercel.app