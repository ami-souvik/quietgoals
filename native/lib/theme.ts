import { useColorScheme } from 'react-native';

export const COLORS = {
  light: {
    background: '#F9FAFB',
    text: '#111111',
    textSecondary: '#64748B',
    card: '#ffffff',
    cardSecondary: '#F1F5F9',
    icon: '#111111',
    iconInactive: '#A0A0A0',
    pinBg: '#F8FAFC',
    pinActiveBg: '#FEF3C7',
    shadowOpacity: 0.05,
    primary: '#111111',
    primaryBackground: '#ffffff',
    projectColors: {
      'Inbox': { bg: '#F1F5F9', text: '#475569' },
      'Work': { bg: '#E0E7FF', text: '#3730A3' },
      'Personal': { bg: '#FEF3C7', text: '#92400E' },
      'Errands': { bg: '#DCFCE7', text: '#166534' }
    } as Record<string, { bg: string, text: string }>
  },
  dark: {
    background: '#1c1c1c',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    card: '#0e0e0e',
    cardSecondary: '#0F172A',
    icon: '#F8FAFC',
    iconInactive: '#475569',
    pinBg: '#0F172A',
    pinActiveBg: '#92400E',
    shadowOpacity: 0.3,
    primary: '#F8FAFC',
    primaryBackground: '#000000',
    projectColors: {
      'Inbox': { bg: '#1E293B', text: '#E2E8F0' },
      'Work': { bg: '#3730A3', text: '#E0E7FF' },
      'Personal': { bg: '#92400E', text: '#FEF3C7' },
      'Errands': { bg: '#166534', text: '#DCFCE7' }
    } as Record<string, { bg: string, text: string }>
  }
};

export type ThemeColors = typeof COLORS.light;

export const useTheme = () => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    isDark,
    colors: isDark ? COLORS.dark : COLORS.light,
  };
};
