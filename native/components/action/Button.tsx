import { StyleProp, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps, ViewStyle, TextStyle } from "react-native";
import { LucideIcon } from "lucide-react-native";

interface ButtonProps extends TouchableOpacityProps {
    icon?: LucideIcon;
    label: string;
    onPress: () => void;
    buttonStyle?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({ icon: Icon, label, onPress, buttonStyle, textStyle }: ButtonProps) => {
    return (
        <TouchableOpacity
            style={[styles.button, buttonStyle]}
            onPress={onPress}
        >
            {Icon && <Icon size={24} color="#111" />}
            <Text style={[styles.buttonText, textStyle]}>
                {label}
            </Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        flex: 1,
        backgroundColor: '#111',
        paddingVertical: 20,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontFamily: 'Calm-Bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
})