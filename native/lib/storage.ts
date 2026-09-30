import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateWidget } from './widget';
import { MoodType, BgMode } from './types';

export interface TodoItem {
  id: string;
  text: string; // Legacy, map to title
  title?: string;
  completed: boolean; // Legacy, map to status
  status?: 'active' | 'completed' | 'killed';
  priority?: 'none' | 'low' | 'medium' | 'high';
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
const WALLPAPER_CUSTOMIZATION_KEY = '@quiet_goals_wallpaper_customization'

export const saveActiveGoal = async (goal: ActiveGoal) => {
  try {
    const jsonValue = JSON.stringify(goal);
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    await addToHistory(goal);
    updateWidget(jsonValue);
  } catch (e) {
    console.error('Failed to save active goal', e);
  }
};

export const getActiveGoal = async (): Promise<ActiveGoal | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Failed to fetch active goal', e);
    return null;
  }
};

export const addToHistory = async (goal: ActiveGoal) => {
  try {
    const historyJson = await AsyncStorage.getItem(HISTORY_KEY);
    let history: ActiveGoal[] = historyJson ? JSON.parse(historyJson) : [];
    
    // Check if exactly same goal already exists in history (optional, but good to avoid duplicates)
    const isDuplicate = history.some(item => 
      item.text === goal.text && 
      item.templateId === goal.templateId
    );

    if (!isDuplicate) {
      history = [goal, ...history].slice(0, 20); // Keep last 20
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  } catch (e) {
    console.error('Failed to add to history', e);
  }
};

export const getHistory = async (): Promise<ActiveGoal[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(HISTORY_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Failed to fetch history', e);
    return [];
  }
};

export const removeFromHistory = async (timestamp: number) => {
  try {
    const historyJson = await AsyncStorage.getItem(HISTORY_KEY);
    const history: ActiveGoal[] = historyJson ? JSON.parse(historyJson) : [];
    const updated = history.filter(h => h.timestamp !== timestamp);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to remove from history', e);
  }
};

export const getTasks = async (): Promise<TodoItem[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(TASKS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Failed to fetch tasks', e);
    return [];
  }
};

export const saveTasks = async (tasks: TodoItem[]) => {
  try {
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks', e);
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