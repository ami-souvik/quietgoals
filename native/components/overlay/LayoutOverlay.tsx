import { View, TouchableOpacity, StyleSheet } from "react-native";
import {
    TextAlignStart,
    TextAlignCenter,
    TextAlignEnd,
    Dot
} from "lucide-react-native";
import { useCreatorStore } from "../CreatorContext";
import { useTheme, ThemeColors } from '../../lib/theme';

const getVariantIcon = (id: string, color: string) => {
    const size = 16;
    switch (id) {
        case 'left': return <TextAlignStart size={size} color={color} strokeWidth={3} />;
        case 'center': return <TextAlignCenter size={size} color={color} strokeWidth={3} />;
        case 'right': return <TextAlignEnd size={size} color={color} strokeWidth={3} />;
        default: return <Dot size={size} color={color} />;
    }
}

export const LayoutOverlay = () => {
    const { variantId, setVariantId } = useCreatorStore();
    const { colors } = useTheme();
    const styles = getStyles(colors);

    const renderButton = (vertical: string, horizontal: string) => {
        const id = `${vertical}-${horizontal}`;
        const isSelected = variantId === id;
        return (
            <TouchableOpacity
                key={id}
                onPress={() => setVariantId(id)}
                style={[
                    styles.toolChip,
                    {
                        backgroundColor: isSelected ? '#fff' : 'transparent'
                    }
                ]}
            >
                {
                    isSelected ?
                        getVariantIcon(horizontal, '#333')
                        : <Dot size={16} color='#fff' />
                }
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.gridContainer}>
            <View style={styles.gridRow}>
                {renderButton('top', 'left')}
                {renderButton('top', 'center')}
                {renderButton('top', 'right')}
            </View>
            <View style={styles.gridRow}>
                {renderButton('center', 'left')}
                {renderButton('center', 'center')}
                {renderButton('center', 'right')}
            </View>
            <View style={styles.gridRow}>
                {renderButton('bottom', 'left')}
                {renderButton('bottom', 'center')}
                {renderButton('bottom', 'right')}
            </View>
        </View>
    );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
    gridContainer: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 4,
        marginBottom: 16,
        borderRadius: 8,
        backgroundColor: `${colors.card}88`,
        gap: 4
    },
    gridRow: {
        flexDirection: 'row',
        gap: 4
    },
    toolChip: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8
    }
});