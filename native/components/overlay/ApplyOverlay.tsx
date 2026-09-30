import { TouchableOpacity, StyleSheet, Text, View } from "react-native";
import { House, Lock, Smartphone } from 'lucide-react-native';

interface ApplyOverlayProps {
    handleSetWallpaper: (type: 'screen' | 'lock' | 'both') => void;
}

export const ApplyOverlay: React.FC<ApplyOverlayProps> = ({ handleSetWallpaper }: ApplyOverlayProps) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => handleSetWallpaper('screen')} style={styles.applyOption}>
                <House color="#fff" size={20} />
                <Text style={styles.applyOptionText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSetWallpaper('lock')} style={styles.applyOption}>
                <Lock color="#fff" size={20} />
                <Text style={styles.applyOptionText}>Lock</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSetWallpaper('both')} style={styles.applyOption}>
                <Smartphone color="#fff" size={20} />
                <Text style={styles.applyOptionText}>Both</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#333',
        borderRadius: 16,
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 8,
        gap: 8,
    },
    applyOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingLeft: 6,
        paddingRight: 12,
        borderRadius: 8,
    },
    applyOptionText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
});