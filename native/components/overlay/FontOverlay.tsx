import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Bold } from 'lucide-react-native';
import { useCreatorStore } from '../CreatorContext';
import { useTheme, ThemeColors } from '../../lib/theme';

export const FontOverlay: React.FC = () => {
    const {
        fontSizeScale,
        setFontSizeScale,
        isBold,
        toggleBold
    } = useCreatorStore();
    const { colors } = useTheme();
    const styles = getStyles(colors);

    return (
        <View style={styles.container}>
            <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>A</Text>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Slider
                        style={[styles.slider, { width: '80%', transform: [{ scale: 1.3 }] }]}
                        minimumValue={1}
                        maximumValue={2}
                        value={fontSizeScale}
                        onValueChange={setFontSizeScale}
                        minimumTrackTintColor="#fff"
                        maximumTrackTintColor="#555"
                        thumbTintColor="#fff"
                    />
                </View>
                <Text style={[styles.sliderLabel, { fontSize: 24 }]}>A</Text>
            </View>
            <TouchableOpacity
                onPress={toggleBold}
                style={[
                    styles.boldButton,
                    {
                        backgroundColor: isBold ? '#fff' : '#333',
                        borderColor: isBold ? '#fff' : 'transparent',
                    }
                ]}
            >
                <Bold color={isBold ? '#111' : '#fff'} size={20} strokeWidth={isBold ? 4 : 2} style={{ padding: 2 }} />
            </TouchableOpacity>
        </View>
    );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${colors.card}88`,
        paddingLeft: 20,
        paddingRight: 12,
        paddingVertical: 8,
        borderRadius: 32,
        marginHorizontal: 32,
        marginBottom: 16,
        gap: 16
    },
    sliderContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    slider: {
        height: 40,
    },
    sliderLabel: {
        color: colors.text,
        fontFamily: 'Calm-Bold',
        fontSize: 16,
    },
    boldButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
        backgroundColor: '#333',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
        borderWidth: 2
    }
});
