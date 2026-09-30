import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, View, TextInput, TouchableOpacity,
    Text, TouchableWithoutFeedback, Keyboard, Platform, ScrollView
} from 'react-native';
import { AlignLeft, Clock, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCreatorStore } from '../CreatorContext';
import { NativeKeyboardAvoidingView } from '../native/NativeKeyboardAvoidingView';
import { useTheme, ThemeColors } from '../../lib/theme';

interface QuietCreatorOverlayProps {
    visible: boolean;
    onClose: () => void;
}

const PROJECTS = ['Inbox', 'Work', 'Personal', 'Errands'];

export const QuietCreatorOverlay: React.FC<QuietCreatorOverlayProps> = ({ visible, onClose }) => {
    const { colors } = useTheme();
    const styles = getStyles(colors);
    const insets = useSafeAreaInsets();
    const [text, setText] = useState('');
    const [selectedProject, setSelectedProject] = useState('Inbox');
    const { addTasks, updateTask, editingTask } = useCreatorStore();
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (visible) {
            if (editingTask) {
                setText(editingTask.text);
                setSelectedProject(editingTask.project || 'Inbox');
            } else {
                setText('');
                setSelectedProject('Inbox');
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
                text: text.trim(),
                project: selectedProject
            });
        } else {
            await addTasks([{
                id: Date.now().toString(),
                text: text.trim(),
                completed: false,
                project: selectedProject,
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
                            {PROJECTS.map(proj => (
                                <TouchableOpacity
                                    key={proj}
                                    style={[styles.projectChip, selectedProject === proj && styles.projectChipSelected]}
                                    onPressIn={() => setSelectedProject(proj)}
                                >
                                    <Text style={[styles.projectChipText, selectedProject === proj && styles.projectChipTextSelected]}>
                                        {proj}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.toolbar}>
                            <View style={styles.iconGroup}>
                                <TouchableOpacity style={styles.iconButton}>
                                    <AlignLeft size={20} color={colors.icon} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.iconButton}>
                                    <Clock size={20} color={colors.icon} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.iconButton}>
                                    <Star size={20} color={colors.icon} />
                                </TouchableOpacity>
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
    iconGroup: {
        flexDirection: 'row',
        gap: 16,
    },
    iconButton: {
        padding: 8,
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
