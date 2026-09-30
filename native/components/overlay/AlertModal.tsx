import React from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useTheme, ThemeColors } from '../../lib/theme';

export interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  onCancel?: () => void;
  onAccept?: () => void;
  cancelText?: string;
  acceptText?: string;
  children?: React.ReactNode;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  title,
  message,
  onCancel,
  onAccept,
  cancelText = "Cancel",
  acceptText = "OK",
  children,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onCancel}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        
        <View style={styles.modalContent}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {children}

          <View style={styles.actions}>
            {onCancel && (
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            {onAccept && (
              <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
                <Text style={styles.acceptText}>{acceptText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Calm-Bold',
    color: colors.text,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Calm-Regular',
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.cardSecondary,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: 'Calm-Bold',
    color: colors.textSecondary,
  },
  acceptButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  acceptText: {
    fontSize: 15,
    fontFamily: 'Calm-Bold',
    color: colors.primaryBackground,
  }
});
