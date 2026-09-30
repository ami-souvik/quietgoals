import React from 'react';
import { Modal, StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export interface QuietAlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

export interface QuietAlertOptions {
    visible: boolean;
    title: string;
    message: string;
    buttons?: QuietAlertButton[];
    onDismiss: () => void;
}

export const QuietAlert: React.FC<QuietAlertOptions> = ({
    visible,
    title,
    message,
    buttons = [],
    onDismiss
}) => {
    const isStacked = buttons.length > 2;

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}>
            <View style={styles.overlay}>
                <View style={styles.alertBox}>
                    <Text style={styles.title}>{title}</Text>
                    {!!message && <Text style={styles.message}>{message}</Text>}
                    <View style={[styles.buttonContainer, isStacked && styles.stackedContainer]}>
                        {buttons.map((btn, index) => {
                            const isCancel = btn.style === 'cancel';
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.button,
                                        isCancel ? styles.cancelButton : styles.confirmButton,
                                        isStacked && styles.stackedButton
                                    ]}
                                    onPress={() => {
                                        onDismiss();
                                        btn.onPress?.();
                                    }}
                                >
                                    <Text style={isCancel ? styles.cancelButtonText : styles.confirmButtonText}>
                                        {btn.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertBox: {
        width: '80%',
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#333'
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontFamily: 'Calm-Bold',
        marginBottom: 12,
        textAlign: 'center'
    },
    message: {
        color: '#CCC',
        fontSize: 16,
        fontFamily: 'Calm-Regular',
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        gap: 12
    },
    stackedContainer: {
        flexDirection: 'column',
        gap: 12
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    stackedButton: {
        flex: undefined,
        width: '100%'
    },
    cancelButton: {
        backgroundColor: '#333',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Calm-Bold'
    },
    confirmButton: {
        backgroundColor: '#fff',
    },
    confirmButtonText: {
        color: '#111',
        fontSize: 16,
        fontFamily: 'Calm-Bold'
    }
});
