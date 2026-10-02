import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateWidget } from './widget';
import { MoodType, BgMode } from './types';

export interface TodoItem {
  id: string;
  text: string; // Legacy, map to title
  title?: string;
  completed: boolean; // Legacy, map to status
  status?: 'not-started' | 'in-progress' | 'completed' | 'killed' | 'active';
  priority?: 'none' | 'low' | 'medium' | 'high';
  description?: string | null;
  link?: string | null;
  position?: string;
  project?: string;
  isPinned?: boolean;
  createdAt?: number | string;
}

export interface ActiveGoal {
  type?: 'goal' | 'todo';
  text: string;
  templateId?: string;
  todoItems?: TodoItem[];
  timestamp: number;
}

export interface WallpaperCustomizationParams {
  moodId?: MoodType;
  variantId?: string;
  fontSizeScale?: number;
  isBold?: boolean;
  bgMode?: BgMode;
  backgroundImage?: string | null;
}

const STORAGE_KEY = '@quiet_goals_active';
const HISTORY_KEY = '@quiet_goals_history';
const TASKS_KEY = '@quiet_goals_tasks';
const PIN_WARNING_KEY = '@quiet_goals_pin_warning';
const WALLPAPER_CUSTOMIZATION_KEY = '@quiet_goals_wallpaper_customization';

export const normalizeEmail = (email?: string | null): string | null => {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
};

const getScopedKey = (baseKey: string, userEmail?: string | null): string => {
  const norm = normalizeEmail(userEmail);
  return norm ? `${baseKey}:${norm}` : `${baseKey}:guest`;
};

export const saveActiveGoal = async (goal: ActiveGoal, userEmail?: string | null) => {
  try {
    const jsonValue = JSON.stringify(goal);
    const key = getScopedKey(STORAGE_KEY, userEmail);
    await AsyncStorage.setItem(key, jsonValue);
    // Also keep base key updated for widget if user is logged in
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    await addToHistory(goal, userEmail);
    updateWidget(jsonValue);
  } catch (e) {
    console.error('Failed to save active goal', e);
  }
};

export const getActiveGoal = async (userEmail?: string | null): Promise<ActiveGoal | null> => {
  try {
    const key = getScopedKey(STORAGE_KEY, userEmail);
    let jsonValue = await AsyncStorage.getItem(key);
    if (!jsonValue && !normalizeEmail(userEmail)) {
      // Fallback to legacy un-scoped key for guest
      jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    }
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Failed to fetch active goal', e);
    return null;
  }
};

export const addToHistory = async (goal: ActiveGoal, userEmail?: string | null) => {
  try {
    const key = getScopedKey(HISTORY_KEY, userEmail);
    const historyJson = await AsyncStorage.getItem(key);
    let history: ActiveGoal[] = historyJson ? JSON.parse(historyJson) : [];
    
    // Check if exactly same goal already exists in history
    const isDuplicate = history.some(item => 
      item.text === goal.text && 
      item.templateId === goal.templateId
    );

    if (!isDuplicate) {
      history = [goal, ...history].slice(0, 20); // Keep last 20
      await AsyncStorage.setItem(key, JSON.stringify(history));
    }
  } catch (e) {
    console.error('Failed to add to history', e);
  }
};

export const getHistory = async (userEmail?: string | null): Promise<ActiveGoal[]> => {
  try {
    const key = getScopedKey(HISTORY_KEY, userEmail);
    let jsonValue = await AsyncStorage.getItem(key);
    if (!jsonValue && !normalizeEmail(userEmail)) {
      // Fallback to legacy un-scoped key for guest
      jsonValue = await AsyncStorage.getItem(HISTORY_KEY);
    }
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Failed to fetch history', e);
    return [];
  }
};

export const removeFromHistory = async (timestamp: number, userEmail?: string | null) => {
  try {
    const key = getScopedKey(HISTORY_KEY, userEmail);
    const historyJson = await AsyncStorage.getItem(key);
    const history: ActiveGoal[] = historyJson ? JSON.parse(historyJson) : [];
    const updated = history.filter(h => h.timestamp !== timestamp);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to remove from history', e);
  }
};

export const getTasks = async (userEmail?: string | null): Promise<TodoItem[]> => {
  try {
    const key = getScopedKey(TASKS_KEY, userEmail);
    let jsonValue = await AsyncStorage.getItem(key);
    if (!jsonValue && !normalizeEmail(userEmail)) {
      // Fallback to legacy un-scoped key for guest
      jsonValue = await AsyncStorage.getItem(TASKS_KEY);
    }
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Failed to fetch tasks', e);
    return [];
  }
};

export const saveTasks = async (tasks: TodoItem[], userEmail?: string | null) => {
  try {
    const key = getScopedKey(TASKS_KEY, userEmail);
    await AsyncStorage.setItem(key, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks', e);
  }
};

/**
 * Automatically migrate offline/guest tasks to the logged-in user's email-isolated store
 */
export const migrateGuestTasksToUser = async (userEmail: string): Promise<TodoItem[]> => {
  const norm = normalizeEmail(userEmail);
  if (!norm) return [];

  try {
    // 1. Fetch guest tasks (check scoped guest key first, then legacy un-scoped key)
    const guestKey = `${TASKS_KEY}:guest`;
    const guestJson = await AsyncStorage.getItem(guestKey);
    const legacyJson = await AsyncStorage.getItem(TASKS_KEY);

    const guestTasks: TodoItem[] = guestJson
      ? JSON.parse(guestJson)
      : (legacyJson ? JSON.parse(legacyJson) : []);

    if (!guestTasks || guestTasks.length === 0) {
      return [];
    }

    // 2. Fetch existing user tasks
    const userKey = `${TASKS_KEY}:${norm}`;
    const userJson = await AsyncStorage.getItem(userKey);
    const userTasks: TodoItem[] = userJson ? JSON.parse(userJson) : [];

    // 3. Merge avoiding duplicates by id
    const existingIds = new Set(userTasks.map(t => t.id));
    const newTasks = guestTasks.filter(t => !existingIds.has(t.id));
    const merged = [...newTasks, ...userTasks];

    // 4. Save merged into user's store
    await AsyncStorage.setItem(userKey, JSON.stringify(merged));

    // 5. Clear guest stores so we don't re-import
    await AsyncStorage.removeItem(guestKey);
    await AsyncStorage.removeItem(TASKS_KEY);

    return newTasks;
  } catch (e) {
    console.error('Failed to migrate guest tasks to user:', e);
    return [];
  }
};

export const getPinWarningAccepted = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(PIN_WARNING_KEY);
    return value === 'true';
  } catch (e) {
    return false;
  }
};

export const setPinWarningAccepted = async (accepted: boolean) => {
  try {
    await AsyncStorage.setItem(PIN_WARNING_KEY, accepted ? 'true' : 'false');
  } catch (e) {
    console.error('Failed to save pin warning flag', e);
  }
};

export const getWallpaperCustomization = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(WALLPAPER_CUSTOMIZATION_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : {};
  } catch (e) {
    console.error('Failed to fetch wallpaper customization', e);
    return {};
  }
}

export const setWallpaperCustomization = async (customization: WallpaperCustomizationParams) => {
  try {
    const jsonValue = await AsyncStorage.getItem(WALLPAPER_CUSTOMIZATION_KEY);
    const prevCustomization = jsonValue != null ? JSON.parse(jsonValue) : {};
    await AsyncStorage.setItem(WALLPAPER_CUSTOMIZATION_KEY, JSON.stringify({ ...prevCustomization, ...customization }));
  } catch (e) {
    console.error('Failed to save wallpaper customization', e);
  }
}