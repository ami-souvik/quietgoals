import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Dimensions, Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as WallpaperManager from 'expo-wallpaper-manager';
import { CONFIG } from '../lib/config';
import {
    ActiveGoal,
    TodoItem,
    addToHistory,
    getActiveGoal,
    getHistory,
    removeFromHistory,
    saveActiveGoal,
    getTasks,
    saveTasks as storageSaveTasks,
    getPinWarningAccepted,
    setPinWarningAccepted,
    setWallpaperCustomization,
    getWallpaperCustomization
} from '../lib/storage';
import { updateWidget } from '../lib/widget';
import { TemplateType, MoodType, BgMode, ToolType } from '../lib/types';
import { useAppContext } from './AppContext';
import { useToast } from './ToastContext';

interface CreatorContextType {
    // Current simple state (templates) - might be removed later if completely unused, but leaving for safety
    text: string;
    setText: (t: string) => void;
    templateId: TemplateType;
    setTemplateId: (id: TemplateType) => void;

    // Advanced Wallpaper creator state (restored)
    moodId: MoodType;
    setMoodId: (id: MoodType) => void;
    variantId: string;
    setVariantId: (id: string) => void;
    fontSizeScale: number;
    setFontSizeScale: (scale: number) => void;
    isBold: boolean;
    setIsBold: (bold: boolean) => void;
    toggleBold: () => void;
    bgMode: BgMode;
    setBgMode: (mode: BgMode) => void;
    backgroundImage: string | null;
    setBackgroundImage: (img: string | null) => void;

    // UI state
    activeTool: ToolType;
    setActiveTool: (tool: ToolType) => void;
    loadingImage: boolean;

    // Active goal & history
    activeGoal: ActiveGoal | null;
    history: ActiveGoal[];

    // Old todo state (legacy / transient)
    todoItems: TodoItem[];
    setTodoItems: (items: TodoItem[]) => void;

    // New unified tasks canvas state
    allTasks: TodoItem[];
    addTasks: (tasks: TodoItem[]) => Promise<void>;
    updateTask: (id: string, updates: Partial<TodoItem>) => Promise<void>;
    toggleTaskCompletion: (id: string) => Promise<void>;
    toggleTaskPin: (id: string) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;

    // Overlay State
    isOverlayOpen: boolean;
    editingTask: TodoItem | null;
    openOverlay: (task?: TodoItem) => void;
    closeOverlay: () => void;

    // Pin Warning State
    isPinWarningVisible: boolean;
    hidePinWarning: () => void;
    handlePinWarningAccept: (dontShowAgain: boolean) => Promise<void>;

    // ViewShot ref
    viewShotRef: React.RefObject<any>;

    // Actions
    toggleBgMode: () => void;
    refreshImage: (mood?: MoodType) => void;
    handlePickImage: () => void;
    saveWallpaper: () => Promise<void>;
    setWallpaper: (type: 'screen' | 'lock' | 'both') => Promise<void>;
    saveTodoGoal: () => Promise<void>;
    deleteFromHistory: (timestamp: number) => Promise<void>;
}

const CreatorContext = createContext<CreatorContextType | undefined>(undefined);

export const CreatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { showAlert } = useAppContext();
    const { showToast } = useToast();
    const { width, height } = Dimensions.get('window');

    const [activeGoal, setActiveGoal] = useState<ActiveGoal | null>(null);
    const [history, setHistory] = useState<ActiveGoal[]>([]);

    // Core inputs
    const [text, setText] = useState('Quiet Goals');
    const [templateId, setTemplateId] = useState<TemplateType>('corporate');

    // Restored Advanced inputs
    const [moodId, setMoodId] = useState<MoodType>('calm');
    const [variantId, setVariantId] = useState('center-center');
    const [fontSizeScale, setFontSizeScale] = useState(1.0);
    const [isBold, setIsBold] = useState(false);
    const [bgMode, setBgMode] = useState<BgMode>('procedural');
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<ToolType>('none');
    const [loadingImage, setLoadingImage] = useState(false);

    // Tasks states
    const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
    const [allTasks, setAllTasks] = useState<TodoItem[]>([]);

    // Overlay states
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<TodoItem | null>(null);

    // Pin warning states
    const [isPinWarningVisible, setIsPinWarningVisible] = useState(false);
    const [taskToPin, setTaskToPin] = useState<string | null>(null);
    const [hasAcceptedPinWarning, setHasAcceptedPinWarning] = useState(false);

    const viewShotRef = useRef<any>(null);

    useEffect(() => {
        const init = async () => {
            const goal = await getActiveGoal();
            if (goal) {
                setActiveGoal(goal);
                updateWidget(JSON.stringify(goal));
            }
            const hist = await getHistory();
            setHistory(hist);
            const tasks = await getTasks();
            setAllTasks(tasks);
            const warningAccepted = await getPinWarningAccepted();
            const pinnedTasks = tasks.filter(t => t.isPinned);
            setHasAcceptedPinWarning(warningAccepted || pinnedTasks.length > 0);
            const wallpaperCustomization = await getWallpaperCustomization();
            if (wallpaperCustomization.moodId) setMoodId(wallpaperCustomization.moodId);
            if (wallpaperCustomization.variantId) setVariantId(wallpaperCustomization.variantId);
            if (wallpaperCustomization.fontSizeScale) setFontSizeScale(wallpaperCustomization.fontSizeScale);
            if (wallpaperCustomization.isBold) setIsBold(wallpaperCustomization.isBold);
            if (wallpaperCustomization.bgMode) setBgMode(wallpaperCustomization.bgMode);
            if (wallpaperCustomization.backgroundImage) setBackgroundImage(wallpaperCustomization.backgroundImage);
        };
        init();
    }, []);

    // Task Actions
    const syncPinnedTasksToGoal = async (tasks: TodoItem[]) => {
        const pinned = tasks.filter(t => t.isPinned && !t.completed);
        const firstTask = pinned[0]?.text || 'My Tasks';
        const newGoal: ActiveGoal = { type: 'todo', text: firstTask, todoItems: pinned, timestamp: Date.now() };
        await saveActiveGoal(newGoal);
        setActiveGoal(newGoal);
        setHistory(await getHistory());
    };

    const addTasks = async (newTasks: TodoItem[]) => {
        const updated = [...newTasks, ...allTasks];
        setAllTasks(updated);
        await storageSaveTasks(updated);
        if (newTasks.some(t => t.isPinned)) {
            await syncPinnedTasksToGoal(updated);
        }
    };

    const updateTask = async (id: string, updates: Partial<TodoItem>) => {
        const updated = allTasks.map(t => t.id === id ? { ...t, ...updates } : t);
        setAllTasks(updated);
        await storageSaveTasks(updated);
        await syncPinnedTasksToGoal(updated);
    };

    const openOverlay = (task?: TodoItem) => {
        if (task) setEditingTask(task);
        else setEditingTask(null);
        setIsOverlayOpen(true);
    };

    const closeOverlay = () => {
        setIsOverlayOpen(false);
        setTimeout(() => setEditingTask(null), 300);
    };

    const toggleTaskCompletion = async (id: string) => {
        const updated = allTasks.map(t => {
            if (t.id === id) {
                return { ...t, completed: !t.completed, isPinned: false }; // Unpin on complete
            }
            return t;
        });
        setAllTasks(updated);
        await storageSaveTasks(updated);
        await syncPinnedTasksToGoal(updated);
    };

    const executePin = async (id: string, willPin: boolean, skipWallpaperUpdate = false) => {
        const updated = allTasks.map(t => t.id === id ? { ...t, isPinned: willPin } : t);
        setAllTasks(updated);
        await storageSaveTasks(updated);
        await syncPinnedTasksToGoal(updated);

        if (willPin) {
            showToast('Task pinned!', 'success');
        } else {
            showToast('Task unpinned.', 'success');
        }
        if (!skipWallpaperUpdate && hasAcceptedPinWarning) {
            // Wait for the react state to update the WallpaperCanvas before capturing
            setTimeout(() => {
                setWallpaper('lock');
            }, 300);
        }
    };

    const toggleTaskPin = async (id: string) => {
        const pinnedCount = allTasks.filter(t => t.isPinned).length;
        const task = allTasks.find(t => t.id === id);

        if (task && !task.isPinned && pinnedCount >= 3) {
            showToast('You can only pin up to 3 tasks to your wallpaper.', 'error');
            return;
        }

        // If pinning the first task, show warning unless previously accepted
        if (task && !task.isPinned && pinnedCount === 0 && !hasAcceptedPinWarning) {
            setTaskToPin(id);
            setIsPinWarningVisible(true);
            return;
        }
        await executePin(id, !task?.isPinned);
    };

    const hidePinWarning = () => {
        setIsPinWarningVisible(false);
        setTaskToPin(null);
    };

    const handlePinWarningAccept = async (dontShowAgain: boolean) => {
        setIsPinWarningVisible(false);
        if (dontShowAgain) {
            setHasAcceptedPinWarning(true);
            await setPinWarningAccepted(true);
        }

        if (taskToPin) {
            const updated = allTasks.map(t => t.id === taskToPin ? { ...t, isPinned: true } : t);
            setAllTasks(updated);
            await storageSaveTasks(updated);
            await syncPinnedTasksToGoal(updated);

            showToast('Task pinned!', 'success');

            // Wait for render, then set wallpaper
            setTimeout(() => {
                setWallpaper('lock');
            }, 300);
        }
        setTaskToPin(null);
    };

    const deleteTask = async (id: string) => {
        const updated = allTasks.filter(t => t.id !== id);
        setAllTasks(updated);
        await storageSaveTasks(updated);
        await syncPinnedTasksToGoal(updated);
    };

    const persist = (key: string, fn: (arg: any) => void) => (value: any) => {
        setWallpaperCustomization({ [key]: value });
        fn(value);
    }

    // Advanced Customization Actions
    const setMood = (id: MoodType) => {
        setMoodId(id);
        if (bgMode === 'image') refreshImage(id);
    };

    const toggleBold = () => persist('isBold', setIsBold)(!isBold);

    const refreshImage = async (mood?: MoodType) => {
        if (loadingImage) return;
        setLoadingImage(true);
        try {
            const images = CONFIG[mood || moodId]?.images;
            if (images && images.length > 0) {
                setBackgroundImage(img => {
                    const idx = images.findIndex(i => i === img);
                    return images[(idx + 1) % images.length];
                });
                setBgMode('image');
            } else {
                setBgMode('procedural');
            }
        } catch (e) {
            console.error(e);
            setBgMode('procedural');
        } finally {
            setLoadingImage(false);
        }
    };

    const toggleBgMode = () => {
        if (bgMode === 'image') {
            setBackgroundImage(null);
            persist('bgMode', setBgMode)('procedural')
        } else {
            persist('bgMode', setBgMode)('image')
            refreshImage();
        }
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [9, 16],
            quality: 1,
        });
        if (!result.canceled) {
            setBackgroundImage(result.assets[0].uri);
            setBgMode('image');
        }
    };

    const captureView = async (): Promise<string | null> => {
        if (viewShotRef.current?.capture) {
            return await viewShotRef.current.capture();
        }
        return null;
    };

    const saveWallpaper = async () => {
        try {
            setWallpaperCustomization({ moodId, variantId, fontSizeScale, isBold, bgMode, backgroundImage });
            setWallpaper('lock');
            showToast('Wallpaper customization saved', 'success');
        } catch (e) {
            console.error('Save error:', e);
            showToast('Failed to save wallpaper', 'error');
        }
    };

    const setWallpaper = async (type: 'screen' | 'lock' | 'both' = 'both') => {
        try {
            if (Platform.OS === 'ios') {
                showAlert('iOS Restriction', 'iOS does not allow apps to set wallpaper directly. Please "Save" to photos and set it manually.', [{ text: 'OK' }]);
                return;
            }
            const uri = await captureView();
            if (!uri) return;
            const res = WallpaperManager.setWallpaper({ uri, type });
            if (res === 'success') {
                const newGoal: ActiveGoal = { type: 'goal', text, templateId, timestamp: Date.now() };
                await saveActiveGoal(newGoal);
                setActiveGoal(newGoal);
                setHistory(await getHistory());
                const location = type === 'both' ? 'Homescreen & Lockscreen' : type === 'lock' ? 'Lockscreen' : 'Homescreen';
                showToast(`${location} updated!`, 'success');
            } else {
                showToast('Failed to update wallpaper', 'error');
            }
        } catch (e) {
            console.error('Set Wallpaper error:', e);
            showToast('Error setting wallpaper', 'error');
        }
    };

    const saveTodoGoal = async () => {
        const firstTask = todoItems[0]?.text || 'My Tasks';
        const newGoal: ActiveGoal = { type: 'todo', text: firstTask, todoItems, timestamp: Date.now() };
        await saveActiveGoal(newGoal);
        setActiveGoal(newGoal);
        setHistory(await getHistory());
        showToast('Tasks saved and active!', 'success');
    };

    const deleteFromHistory = async (timestamp: number) => {
        await removeFromHistory(timestamp);
        setHistory(prev => prev.filter(h => h.timestamp !== timestamp));
    };

    return (
        <CreatorContext.Provider
            value={{
                text, setText,
                templateId, setTemplateId,
                moodId, setMoodId: persist('moodId', setMood),
                variantId, setVariantId: persist('variantId', setVariantId),
                fontSizeScale, setFontSizeScale: persist('fontSizeScale', setFontSizeScale),
                isBold, setIsBold: persist('isBold', setIsBold), toggleBold,
                bgMode, setBgMode: persist('bgMode', setBgMode), toggleBgMode,
                backgroundImage, setBackgroundImage: persist('backgroundImage', setBackgroundImage),
                activeTool, setActiveTool,
                loadingImage,
                activeGoal,
                history,
                todoItems, setTodoItems,
                allTasks, addTasks, updateTask, toggleTaskCompletion, toggleTaskPin, deleteTask,
                isOverlayOpen, editingTask, openOverlay, closeOverlay,
                isPinWarningVisible, hidePinWarning, handlePinWarningAccept,
                viewShotRef,
                refreshImage, handlePickImage,
                saveWallpaper, setWallpaper,
                saveTodoGoal,
                deleteFromHistory,
            }}
        >
            {children}
        </CreatorContext.Provider>
    );
};

export const useCreatorStore = () => {
    const context = useContext(CreatorContext);
    if (context === undefined) {
        throw new Error('useCreatorStore must be used within a CreatorProvider');
    }
    return context;
};
