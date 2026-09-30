import { TouchableOpacity, StyleSheet, ScrollView, Text } from "react-native";
import { MOODS } from "../../lib/moods";
import { useCreatorStore } from "../CreatorContext";
import { useTheme, ThemeColors } from '../../lib/theme';

export const MoodOverlay = () => {
    const { moodId, setMoodId } = useCreatorStore();
    const { colors } = useTheme();
    const styles = getStyles(colors);

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolScroll}>
            {Object.values(MOODS).map((m: any) => (
                <TouchableOpacity
                    key={m.id}
                    onPress={() => setMoodId(m.id)}
                    disabled={moodId === m.id}
                    style={[
                        styles.toolChip,
                        {
                            backgroundColor: m.bgColor,
                            borderColor: moodId === m.id ? `${m.textColor}80` : 'transparent',
                        }
                    ]}
                >
                    <Text style={[styles.toolChipText,
                    {
                        color: m.textColor,
                        fontFamily: m.fontFamily,
                        textTransform: m.uppercase ? 'uppercase' : 'capitalize'
                    }
                    ]}>{m.label}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
    toolScroll: {
        flex: 1,
        justifyContent: 'center',
        marginBottom: 16,
        paddingHorizontal: 20,
        gap: 8,
    },
    toolChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 2,
        borderRadius: 16,
        borderWidth: 2
    },
    toolChipText: {
        fontSize: 15,
        fontFamily: 'Calm-Bold',
        color: colors.text,
    }
});