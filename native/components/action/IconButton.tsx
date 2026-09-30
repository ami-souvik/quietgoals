import { StyleProp, StyleSheet, TouchableOpacity, TouchableOpacityProps, ViewStyle } from "react-native";
import { LucideIcon } from "lucide-react-native";
import { useTheme, ThemeColors } from '../../lib/theme';

interface IconButtonProps extends TouchableOpacityProps {
    icon: LucideIcon;
    onPress: () => void;
    buttonStyle?: StyleProp<ViewStyle>;
}

export const IconButton: React.FC<IconButtonProps> = ({ icon: Icon, onPress, buttonStyle }) => {
    const { colors } = useTheme();
    const styles = getStyles(colors);

    return (
        <TouchableOpacity
            style={[styles.button, buttonStyle]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Icon size={24} color={colors.icon} />
        </TouchableOpacity>
    )
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
    button: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: colors.card,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: colors.shadowOpacity,
        shadowRadius: 5,
        elevation: 2,
    }
})