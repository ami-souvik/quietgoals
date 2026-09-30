import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { CheckSquare, Square } from 'lucide-react-native';
import { useTheme, ThemeColors } from '../../lib/theme';
import { AlertModal } from './AlertModal';

interface PinWarningModalProps {
  visible: boolean;
  onAccept: (dontShowAgain: boolean) => void;
  onCancel: () => void;
}

export const PinWarningModal: React.FC<PinWarningModalProps> = ({ visible, onAccept, onCancel }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  return (
    <AlertModal
      visible={visible}
      title="Update Wallpaper?"
      message="Pinning a task will automatically update your lock screen wallpaper to show your tasks. Please make sure you have your current lock screen wallpaper backed up if you wish to restore it later."
      onCancel={onCancel}
      onAccept={() => onAccept(dontShowAgain)}
      cancelText="Cancel"
      acceptText="Accept & Pin"
    >
      <TouchableOpacity 
        style={styles.checkboxContainer} 
        activeOpacity={0.7}
        onPress={() => setDontShowAgain(!dontShowAgain)}
      >
        {dontShowAgain ? <CheckSquare size={20} color={colors.icon} /> : <Square size={20} color={colors.iconInactive} />}
        <Text style={styles.checkboxText}>Don't show this again</Text>
      </TouchableOpacity>
    </AlertModal>
  );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
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
});
