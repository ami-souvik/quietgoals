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
import { useSession } from '../lib/auth-client';
import { playSound } from '../lib/sound';

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
    reorderTasks: (data: TodoItem[], from: number, to: number) => Promise<void>;

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
    
    const { data: session } = useSession();
    
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

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

    // Sync from server when session changes
    useEffect(() => {
        if (session) {
            fetch(`${API_URL}/api/goals`)
                .then(res => res.json())
                .then(data => {
                    if (data.activeGoals) {
                        // Map remote goals to TodoItem format for now
                        const remoteTasks: TodoItem[] = data.activeGoals.map((g: any) => ({
                            id: g.id,
                            text: g.title,
                            title: g.title,
                            completed: false,
                            status: g.status,
                            priority: g.priority,
                            position: g.position,
                            isPinned: g.isPinned,
                            createdAt: g.createdAt,
                        }));
                        setAllTasks(remoteTasks);
                        storageSaveTasks(remoteTasks);
                    }
                })
                .catch(console.error);
        }
    }, [session, API_URL]);

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
        
        if (session) {
            for (const task of newTasks) {
                fetch(`${API_URL}/api/goals`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: task.id,
                        title: task.text,
                        isPinned: task.isPinned
                    })
                }).catch(console.error);
            }
        }
        
        if (newTasks.some(t => t.isPinned)) {
            await syncPinnedTasksToGoal(updated);
        }
        playSound('create');
    };

    const updateTask = async (id: string, updates: Partial<TodoItem>) => {
        const updated = allTasks.map(t => t.id === id ? { ...t, ...updates } : t);
        setAllTasks(updated);
        await storageSaveTasks(updated);
        
        if (session) {
            fetch(`${API_URL}/api/goals/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: updates.title || updates.text,
                    isPinned: updates.isPinned,
                    status: updates.status,
                    priority: updates.priority
                })
            }).catch(console.error);
        }
        
        playSound('save');
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
                const isArchived = t.status === 'completed' || t.status === 'killed' || t.completed;
                if (isArchived) {
                    // Restore to active
                    return { ...t, completed: false, status: 'active', isPinned: false };
                } else {
                    // Mark as completed
                    return { ...t, completed: true, status: 'completed', isPinned: false };
                }
            }
            return t;
        });
        setAllTasks(updated);
        await storageSaveTasks(updated);
        
        if (session) {
            const task = updated.find(t => t.id === id);
            if (task) {
                fetch(`${API_URL}/api/goals/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: task.status, isPinned: false })
                }).catch(console.error);
            }
        }
        
        const toggledTask = updated.find(t => t.id === id);
        if (toggledTask) {
            if (toggledTask.status === 'completed') {
                playSound('complete');
            } else if (toggledTask.status === 'active') {
                playSound('restore');
            }
        }
        
        await syncPinnedTasksToGoal(updated);
    };

    const executePin = async (id: string, willPin: boolean, skipWallpaperUpdate = false) => {
        const updated = allTasks.map(t => t.id === id ? { ...t, isPinned: willPin } : t);
        setAllTasks(updated);
        await storageSaveTasks(updated);
        
        if (session) {
            fetch(`${API_URL}/api/goals/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPinned: willPin })
            }).catch(console.error);
        }
        
        await syncPinnedTasksToGoal(updated);

        if (willPin) {
            playSound('priority');
            showToast('Task pinned!', 'success');
        } else {
            playSound('keyTick');
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
            
            if (session) {
                fetch(`${API_URL}/api/goals/${taskToPin}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isPinned: true })
                }).catch(console.error);
            }
            
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
        const task = allTasks.find(t => t.id === id);
        if (!task) return;

        const isArchived = task.status === 'completed' || task.status === 'killed' || task.completed;

        if (isArchived) {
            // Hard delete
            const updated = allTasks.filter(t => t.id !== id);
            setAllTasks(updated);
            await storageSaveTasks(updated);
            
            if (session) {
                fetch(`${API_URL}/api/goals/${id}`, {
                    method: 'DELETE',
                }).catch(console.error);
            }
            playSound('kill');
            await syncPinnedTasksToGoal(updated);
        } else {
            // Soft delete (kill)
            const updated = allTasks.map(t => {
                if (t.id === id) {
                    return { ...t, status: 'killed', isPinned: false };
                }
                return t;
            });
            setAllTasks(updated);
            await storageSaveTasks(updated);
            
            if (session) {
                fetch(`${API_URL}/api/goals/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'killed', isPinned: false })
                }).catch(console.error);
            }
            playSound('kill');
            await syncPinnedTasksToGoal(updated);
        }
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

    const reorderTasks = async (data: TodoItem[], from: number, to: number) => {
        setAllTasks(data);
        await storageSaveTasks(data);
        
        if (session) {
            const movedTask = data[to];
            const beforeTask = to > 0 ? data[to - 1] : null;
            const afterTask = to < data.length - 1 ? data[to + 1] : null;
            
            fetch(`${API_URL}/api/goals/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: movedTask.id,
                    beforeId: beforeTask?.id || null,
                    afterId: afterTask?.id || null
                })
            }).catch(console.error);
        }
        
        await syncPinnedTasksToGoal(data);
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
                allTasks, addTasks, updateTask, toggleTaskCompletion, toggleTaskPin, deleteTask, reorderTasks,
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
