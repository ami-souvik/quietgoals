import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
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
    migrateGuestTasksToUser,
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
import { authenticatedFetch } from '../lib/api';

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
    refreshTasks: () => Promise<void>;
    isRefreshing: boolean;
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
    const [isRefreshing, setIsRefreshing] = useState(false);
    
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

    const userEmail = session?.user?.email ?? null;

    const refreshTasks = useCallback(async () => {
        setIsRefreshing(true);
        try {
            if (userEmail) {
                const res = await authenticatedFetch('/api/goals');
                if (res.ok) {
                    const data = await res.json();
                    const activeTasks: TodoItem[] = (data.activeGoals || []).map((g: any) => ({
                        id: g.id,
                        text: g.title,
                        title: g.title,
                        completed: false,
                        status: g.status as 'active' | 'completed' | 'killed',
                        priority: g.priority,
                        position: g.position,
                        isPinned: Boolean(g.isPinned),
                        createdAt: g.createdAt,
                    }));

                    const archivedTasks: TodoItem[] = (data.archivedGoals || []).map((g: any) => ({
                        id: g.id,
                        text: g.title,
                        title: g.title,
                        completed: true,
                        status: (g.status as 'completed' | 'killed') || 'completed',
                        priority: g.priority,
                        position: g.position,
                        isPinned: false,
                        createdAt: g.createdAt,
                    }));

                    const remoteTasks = [...activeTasks, ...archivedTasks];
                    const localTasks = await getTasks(userEmail);
                    const remoteIds = new Set(remoteTasks.map(t => t.id));
                    const localOnly = localTasks.filter(t => !remoteIds.has(t.id));

                    if (localOnly.length > 0) {
                        await authenticatedFetch('/api/goals/sync', {
                            method: 'POST',
                            body: JSON.stringify({
                                offlineTasks: localOnly.map(t => ({
                                    id: t.id,
                                    title: t.text || t.title || 'Untitled',
                                    status: t.status || (t.completed ? 'completed' : 'active'),
                                    createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
                                }))
                            })
                        }).catch(console.error);
                    }

                    const combined = [...localOnly, ...remoteTasks];
                    setAllTasks(combined);
                    await storageSaveTasks(combined, userEmail);

                    const pinnedTasks = combined.filter(t => t.isPinned && !t.completed);
                    if (pinnedTasks.length > 0) {
                        const newGoal: ActiveGoal = {
                            type: 'todo',
                            text: pinnedTasks[0].text || 'My Tasks',
                            todoItems: pinnedTasks,
                            timestamp: Date.now()
                        };
                        setActiveGoal(newGoal);
                        updateWidget(JSON.stringify(newGoal));
                    }
                }
            } else {
                const guestTasks = await getTasks(null);
                setAllTasks(guestTasks);
            }
        } catch (err) {
            console.warn('[Sync] Could not refresh remote goals:', err);
        } finally {
            setIsRefreshing(false);
        }
    }, [userEmail]);

    useEffect(() => {
        let isCancelled = false;

        const loadContextForUser = async () => {
            // First load wallpaper customizations (device level)
            const wallpaperCustomization = await getWallpaperCustomization();
            if (!isCancelled) {
                if (wallpaperCustomization.moodId) setMoodId(wallpaperCustomization.moodId);
                if (wallpaperCustomization.variantId) setVariantId(wallpaperCustomization.variantId);
                if (wallpaperCustomization.fontSizeScale) setFontSizeScale(wallpaperCustomization.fontSizeScale);
                if (wallpaperCustomization.isBold) setIsBold(wallpaperCustomization.isBold);
                if (wallpaperCustomization.bgMode) setBgMode(wallpaperCustomization.bgMode);
                if (wallpaperCustomization.backgroundImage) setBackgroundImage(wallpaperCustomization.backgroundImage);
            }

            if (userEmail) {
                // 1. Automatically migrate offline/guest tasks into this signed-in email account
                await migrateGuestTasksToUser(userEmail);

                // 2. Load cached tasks, goal, and history for this user's email
                const localTasks = await getTasks(userEmail);
                if (!isCancelled) {
                    setAllTasks(localTasks);
                    const pinnedTasks = localTasks.filter(t => t.isPinned);
                    const warningAccepted = await getPinWarningAccepted();
                    setHasAcceptedPinWarning(warningAccepted || pinnedTasks.length > 0);
                }

                const goal = await getActiveGoal(userEmail);
                if (!isCancelled && goal) {
                    setActiveGoal(goal);
                    updateWidget(JSON.stringify(goal));
                }

                const hist = await getHistory(userEmail);
                if (!isCancelled) {
                    setHistory(hist);
                }

                // 3. Fetch remote goals from server for this user
                if (!isCancelled) {
                    await refreshTasks();
                }
            } else {
                // Guest mode (logged out)
                const guestTasks = await getTasks(null);
                if (!isCancelled) {
                    setAllTasks(guestTasks);
                    const pinnedTasks = guestTasks.filter(t => t.isPinned);
                    const warningAccepted = await getPinWarningAccepted();
                    setHasAcceptedPinWarning(warningAccepted || pinnedTasks.length > 0);
                }
                const guestGoal = await getActiveGoal(null);
                if (!isCancelled) {
                    setActiveGoal(guestGoal);
                    if (guestGoal) updateWidget(JSON.stringify(guestGoal));
                }
                const guestHist = await getHistory(null);
                if (!isCancelled) {
                    setHistory(guestHist);
                }
            }
        };

        loadContextForUser();

        return () => {
            isCancelled = true;
        };
    }, [userEmail, refreshTasks]);

    // Task Actions
    const syncPinnedTasksToGoal = async (tasks: TodoItem[]) => {
        const pinned = tasks.filter(t => t.isPinned && !t.completed);
        const firstTask = pinned[0]?.text || 'My Tasks';
        const newGoal: ActiveGoal = { type: 'todo', text: firstTask, todoItems: pinned, timestamp: Date.now() };
        await saveActiveGoal(newGoal, userEmail);
        setActiveGoal(newGoal);
        setHistory(await getHistory(userEmail));
    };

    const addTasks = async (newTasks: TodoItem[]) => {
        const updated = [...newTasks, ...allTasks];
        setAllTasks(updated);
        await storageSaveTasks(updated, userEmail);
        
        if (session) {
            for (const task of newTasks) {
                authenticatedFetch('/api/goals', {
                    method: 'POST',
                    body: JSON.stringify({
                        id: task.id,
                        title: task.text || task.title,
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
        await storageSaveTasks(updated, userEmail);
        
        if (session) {
            authenticatedFetch(`/api/goals/${id}`, {
                method: 'PATCH',
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
        const updated: TodoItem[] = allTasks.map(t => {
            if (t.id === id) {
                const isArchived = t.status === 'completed' || t.status === 'killed' || t.completed;
                if (isArchived) {
                    // Restore to active
                    return { ...t, completed: false, status: 'active' as const, isPinned: false };
                } else {
                    // Mark as completed
                    return { ...t, completed: true, status: 'completed' as const, isPinned: false };
                }
            }
            return t;
        });
        setAllTasks(updated);
        await storageSaveTasks(updated, userEmail);
        
        if (session) {
            const task = updated.find(t => t.id === id);
            if (task) {
                authenticatedFetch(`/api/goals/${id}`, {
                    method: 'PATCH',
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
        await storageSaveTasks(updated, userEmail);
        
        if (session) {
            authenticatedFetch(`/api/goals/${id}`, {
                method: 'PATCH',
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
            await storageSaveTasks(updated, userEmail);
            
            if (session) {
                authenticatedFetch(`/api/goals/${taskToPin}`, {
                    method: 'PATCH',
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
            await storageSaveTasks(updated, userEmail);
            
            if (session) {
                authenticatedFetch(`/api/goals/${id}`, {
                    method: 'DELETE',
                }).catch(console.error);
            }
            playSound('kill');
            await syncPinnedTasksToGoal(updated);
        } else {
            // Soft delete (kill)
            const updated: TodoItem[] = allTasks.map(t => {
                if (t.id === id) {
                    return { ...t, status: 'killed' as const, isPinned: false };
                }
                return t;
            });
            setAllTasks(updated);
            await storageSaveTasks(updated, userEmail);
            
            if (session) {
                authenticatedFetch(`/api/goals/${id}`, {
                    method: 'PATCH',
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
        await saveActiveGoal(newGoal, userEmail);
        setActiveGoal(newGoal);
        setHistory(await getHistory(userEmail));
        showToast('Tasks saved and active!', 'success');
    };

    const deleteFromHistory = async (timestamp: number) => {
        await removeFromHistory(timestamp, userEmail);
        setHistory(prev => prev.filter(h => h.timestamp !== timestamp));
    };

    const reorderTasks = async (data: TodoItem[], from: number, to: number) => {
        setAllTasks(data);
        await storageSaveTasks(data, userEmail);
        
        if (session) {
            const movedTask = data[to];
            const beforeTask = to > 0 ? data[to - 1] : null;
            const afterTask = to < data.length - 1 ? data[to + 1] : null;
            
            authenticatedFetch('/api/goals/move', {
                method: 'POST',
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
                refreshTasks, isRefreshing,
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
