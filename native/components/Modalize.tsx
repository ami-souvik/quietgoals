import { View, Modal, Pressable, Text, TouchableOpacity, Animated, StyleSheet } from "react-native";
import { X } from "lucide-react-native";

interface ModalizeProps {
    title: string;
    isVisible: boolean;
    toggle: () => void;
    children: any;
}

export const Modalize: React.FC<ModalizeProps> = ({
    title,
    isVisible,
    toggle,
    children
}) => {
    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="none"
            onRequestClose={toggle}
        >
            <Pressable style={styles.modalOverlay} onPress={toggle}>
                <Animated.View style={styles.sidebarContainer}>
                    <View style={styles.sidebarHeader}>
                        <Text style={styles.sidebarTitle}>{title}</Text>
                        <TouchableOpacity onPress={toggle} style={styles.closeButton}>
                            <X size={24} color="#111" />
                        </TouchableOpacity>
                    </View>
                    {children}
                </Animated.View>
            </Pressable>
        </Modal>
    );
}


const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    sidebarContainer: {
        width: '80%',
        height: '100%',
        backgroundColor: '#fff',
        paddingTop: 60,
        paddingHorizontal: 20,
        shadowColor: "#000",
        shadowOffset: { width: -5, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    sidebarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    sidebarTitle: {
        fontSize: 24,
        fontFamily: 'Calm-Bold',
        color: '#111',
    },
    closeButton: {
        padding: 4,
    }
})
