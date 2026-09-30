import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, View, TextInput, TouchableOpacity,
    Text, TouchableWithoutFeedback, Keyboard, Platform, ScrollView
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCreatorStore } from '../CreatorContext';
import { NativeKeyboardAvoidingView } from '../native/NativeKeyboardAvoidingView';
import { useTheme, ThemeColors } from '../../lib/theme';

interface QuietCreatorOverlayProps {
    visible: boolean;
    onClose: () => void;
}

const PRIORITIES = ['none', 'low', 'medium', 'high'] as const;
type Priority = typeof PRIORITIES[number];

export const QuietCreatorOverlay: React.FC<QuietCreatorOverlayProps> = ({ visible, onClose }) => {
    const { colors } = useTheme();
    const styles = getStyles(colors);
    const insets = useSafeAreaInsets();
    const [text, setText] = useState('');
    const [selectedPriority, setSelectedPriority] = useState<Priority>('none');
    const { addTasks, updateTask, editingTask, deleteTask } = useCreatorStore();
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (visible) {
            if (editingTask) {
                setText(editingTask.title || editingTask.text || '');
                setSelectedPriority(editingTask.priority || 'none');
            } else {
                setText('');
                setSelectedPriority('none');
            }
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [visible, editingTask]);

    const handleSave = async () => {
        if (!text.trim()) return;

        if (editingTask) {
            await updateTask(editingTask.id, {
                title: text.trim(),
                text: text.trim(),
                priority: selectedPriority
            });
        } else {
            await addTasks([{
                id: Date.now().toString(),
                title: text.trim(),
                text: text.trim(),
                completed: false,
                status: 'active',
                priority: selectedPriority,
                isPinned: false,
                createdAt: Date.now()
            }]);
        }

        setText('');
        Keyboard.dismiss();
        onClose();
    };

    if (!visible) return null;

    return (
        <View style={[StyleSheet.absoluteFill, { zIndex: 100, elevation: 100 }]} pointerEvents="box-none">
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={() => {
                    Keyboard.dismiss();
                    onClose();
                }}>
                    <View style={StyleSheet.absoluteFill} />
                </TouchableWithoutFeedback>

                <NativeKeyboardAvoidingView style={styles.keyboardAvoiding}>
                    <View style={[styles.formContainer, { paddingBottom: Math.max(Platform.OS === 'ios' ? 24 : 20, insets.bottom + 20) }]}>
                        <TextInput
                            ref={inputRef}
                            style={styles.input}
                            placeholder="New task..."
                            placeholderTextColor={colors.textSecondary}
                            value={text}
                            onChangeText={setText}
                            multiline
                            maxLength={200}
                            selectionColor={colors.primary}
                        />

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectsScroll} contentContainerStyle={styles.projectsContainer} keyboardShouldPersistTaps="always">
                            {PRIORITIES.map(priority => (
                                <TouchableOpacity
                                    key={priority}
                                    style={[
                                        styles.projectChip, 
                                        selectedPriority === priority && styles.projectChipSelected,
                                        selectedPriority === priority && priority === 'low' && { backgroundColor: '#3b82f644', borderColor: '#3b82f6' },
                                        selectedPriority === priority && priority === 'medium' && { backgroundColor: '#eab30844', borderColor: '#eab308' },
                                        selectedPriority === priority && priority === 'high' && { backgroundColor: '#ef444444', borderColor: '#ef4444' },
                                    ]}
                                    onPressIn={() => setSelectedPriority(priority)}
                                >
                                    <Text style={[styles.projectChipText, selectedPriority === priority && styles.projectChipTextSelected]}>
                                        {priority === 'none' ? 'No Priority' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.toolbar}>
                            <View style={styles.toolbarLeft}>
                                {editingTask && (
                                    <TouchableOpacity 
                                        style={styles.deleteButton} 
                                        onPressIn={() => {
                                            deleteTask(editingTask.id);
                                            setText('');
                                            Keyboard.dismiss();
                                            onClose();
                                        }}
                                    >
                                        <Text style={styles.deleteButtonText}>Delete</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <TouchableOpacity style={styles.saveButton} onPressIn={handleSave}>
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </NativeKeyboardAvoidingView>
            </View>
        </View>
    );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: `${colors.background}88`,
        justifyContent: 'flex-end',
    },
    keyboardAvoiding: {
        width: '100%',
    },
    formContainer: {
        backgroundColor: colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 24 : 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: colors.shadowOpacity,
        shadowRadius: 10,
        elevation: 10,
    },
    input: {
        color: colors.text,
        fontSize: 18,
        fontFamily: 'Calm-Regular',
        minHeight: 40,
        marginBottom: 16,
    },
    projectsScroll: {
        marginBottom: 16,
        maxHeight: 40,
    },
    projectsContainer: {
        gap: 8,
        alignItems: 'center',
    },
    projectChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        backgroundColor: colors.cardSecondary,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    projectChipSelected: {
        backgroundColor: colors.primaryBackground,
        borderColor: colors.textSecondary,
    },
    projectChipText: {
        fontSize: 12,
        fontFamily: 'Calm-Bold',
        color: colors.textSecondary,
    },
    projectChipTextSelected: {
        color: colors.text,
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toolbarLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    deleteButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: '#ef444422',
        borderRadius: 16,
    },
    deleteButtonText: {
        color: '#ef4444',
        fontSize: 14,
        fontFamily: 'Calm-Bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    saveButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: colors.primary,
        borderRadius: 16,
    },
    saveButtonText: {
        color: colors.primaryBackground,
        fontSize: 14,
        fontFamily: 'Calm-Bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    }
});
