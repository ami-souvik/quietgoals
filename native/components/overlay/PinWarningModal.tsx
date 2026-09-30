import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { CheckSquare, Square } from 'lucide-react-native';
import { useTheme, ThemeColors } from '../../lib/theme';

interface PinWarningModalProps {
  visible: boolean;
  onAccept: (dontShowAgain: boolean) => void;
  onCancel: () => void;
}

export const PinWarningModal: React.FC<PinWarningModalProps> = ({ visible, onAccept, onCancel }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onCancel}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        
        <View style={styles.modalContent}>
          <Text style={styles.title}>Update Wallpaper?</Text>
          <Text style={styles.message}>
            Pinning a task will automatically update your lock screen wallpaper to show your tasks.
            Please make sure you have your current lock screen wallpaper backed up if you wish to restore it later.
          </Text>

          <TouchableOpacity 
            style={styles.checkboxContainer} 
            activeOpacity={0.7}
            onPress={() => setDontShowAgain(!dontShowAgain)}
          >
            {dontShowAgain ? <CheckSquare size={20} color={colors.icon} /> : <Square size={20} color={colors.iconInactive} />}
            <Text style={styles.checkboxText}>Don't show this again</Text>
          </TouchableOpacity>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton} onPress={() => onAccept(dontShowAgain)}>
              <Text style={styles.acceptText}>Accept & Pin</Text>
            </TouchableOpacity>
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxText: {
    marginLeft: 12,
    fontSize: 15,
    fontFamily: 'Calm-Regular',
    color: colors.text,
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
