import { TouchableOpacity, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { ArrowUp, Image, ImageOff, RotateCw } from 'lucide-react-native';
import { useCreatorStore } from "../CreatorContext";

export const BgOverlay = () => {
    const {
        bgMode,
        toggleBgMode,
        loadingImage,
        refreshImage,
        handlePickImage
    } = useCreatorStore();

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={toggleBgMode}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
                {bgMode !== 'image' && <Text style={styles.infoText}>Switch to Image</Text>}
                <View style={styles.toolChip}>
                    {bgMode === 'image' ? <ImageOff size={20} color="#fff" style={{ padding: 2 }} />
                        : <Image size={20} color="#fff" style={{ padding: 2 }} />}
                </View>
            </TouchableOpacity>

            {bgMode === 'image' && (
                <>
                    <TouchableOpacity
                        onPress={() => refreshImage()}
                        style={styles.toolChip}
                    >
                        {
                            loadingImage ? <ActivityIndicator color="#fff" style={{ width: 20, height: 20 }} />
                                : <RotateCw width={20} color="#fff" />
                        }
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handlePickImage}
                        style={styles.toolChip}
                    >
                        <ArrowUp width={20} color="#fff" />
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3338',
        padding: 8,
        borderRadius: 32,
        marginHorizontal: 32,
        marginBottom: 16,
        gap: 8
    },
    toolChip: {
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
        elevation: 4
    },
    infoText: {
        marginLeft: 8,
        fontSize: 15,
        fontFamily: 'Calm-Regular',
        color: '#fff',
    },
});