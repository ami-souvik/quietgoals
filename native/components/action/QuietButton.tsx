import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { QuietCreatorOverlay } from "../overlay/QuietCreatorOverlay";
import { Plus } from "lucide-react-native";

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCreatorStore } from "../CreatorContext";
import { useTheme, ThemeColors } from '../../lib/theme';

export const QuietButton = () => {
    const { colors } = useTheme();
    const styles = getStyles(colors);
    const insets = useSafeAreaInsets();
    const { isOverlayOpen, openOverlay, closeOverlay } = useCreatorStore();

    return (
        <>
            <TouchableOpacity
                style={[styles.button, { position: 'absolute', bottom: Math.max(48, insets.bottom + 20), right: 32 }]}
                onPress={() => openOverlay()}
                activeOpacity={0.7}
            >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#000", alignItems: 'center', justifyContent: 'center' }} />
            </TouchableOpacity>
            <QuietCreatorOverlay visible={isOverlayOpen} onClose={closeOverlay} />
        </>
    )
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
    button: {
        padding: 12,
        borderRadius: 16,
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: colors.shadowOpacity,
        shadowRadius: 8,
        elevation: 5,
        alignItems: 'center',
        justifyContent: 'center',
        width: 56,
        height: 56,
    }
})