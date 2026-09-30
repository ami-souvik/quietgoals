import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Platform } from 'react-native';
import { Palette, LayoutTemplate, Image as ImageIcon, ALargeSmall, type LucideIcon, Save } from 'lucide-react-native';
import { useCreatorStore } from './CreatorContext';
import { useTheme, ThemeColors } from '../lib/theme';

interface ToolbarButtonProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  isActive: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon: Icon, label, onPress, isActive }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <TouchableOpacity onPress={onPress} style={[styles.toolbarButton, isActive && styles.toolbarButtonActive]}>
      <Icon color={colors.text} size={24} />
      <Text style={[styles.toolbarLabel, isActive && styles.toolbarLabelActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

interface CreatorToolbarProps {
  onSave: () => void;
}

export const CreatorToolbar: React.FC<CreatorToolbarProps> = ({ onSave }: CreatorToolbarProps) => {
  const { activeTool, setActiveTool } = useCreatorStore();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.toolbar}>
      <ToolbarButton icon={Palette} label="Mood" onPress={() => setActiveTool(activeTool === 'mood' ? 'none' : 'mood')} isActive={activeTool === 'mood'} />

      <ToolbarButton icon={LayoutTemplate} label="Layout" onPress={() => setActiveTool(activeTool === 'layout' ? 'none' : 'layout')} isActive={activeTool === 'layout'} />



      <View style={styles.toolbarDivider} />

      <TouchableOpacity onPress={onSave} style={styles.toolbarButton}>
        <Save color={colors.text} size={24} />
        <Text style={styles.toolbarLabel}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    marginHorizontal: 'auto',
    marginBottom: Platform.OS === 'ios' ? 0 : 0,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  toolbarButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 12,
    minWidth: 50
  },
  toolbarButtonActive: {
    backgroundColor: colors.card,
  },
  toolbarLabel: {
    fontSize: 11,
    fontFamily: 'Calm-Bold',
    color: colors.text,
    marginTop: 4,
  },
  toolbarLabelActive: {
    color: colors.text,
  },
  toolbarDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.textSecondary,
    marginHorizontal: 4,
  }
});
