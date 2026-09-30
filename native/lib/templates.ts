import { TemplateType } from './types';

export interface Template {
  id: TemplateType;
  label: string;
  bgColor: string;
  textColor: string;
  fontFamily: string;
  uppercase: boolean;
  fontSize: number; // base font size
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'center' | 'bottom' | 'top';
  description: string;
}

export const TEMPLATES: Record<TemplateType, Template> = {
  corporate: {
    id: 'corporate',
    label: 'Corporate',
    bgColor: '#F3F4F6', // Light gray
    textColor: '#111827', // Dark gray
    fontFamily: 'Focused-Regular',
    uppercase: false,
    fontSize: 32,
    textAlign: 'center',
    verticalAlign: 'center',
    description: 'Clean, focused, minimal.',
  },
  personal: {
    id: 'personal',
    label: 'Personal',
    bgColor: '#E0E7FF', // Soft indigo/blue
    textColor: '#3730A3', // Deep indigo
    fontFamily: 'Calm-Regular',
    uppercase: false,
    fontSize: 34,
    textAlign: 'center',
    verticalAlign: 'center',
    description: 'Soft, calm, relaxing.',
  },
  urgent: {
    id: 'urgent',
    label: 'Urgent',
    bgColor: '#000000', // Black
    textColor: '#FFFFFF', // White
    fontFamily: 'Oswald-Bold',
    uppercase: true,
    fontSize: 48,
    textAlign: 'center',
    verticalAlign: 'center',
    description: 'High contrast, bold, demanding.',
  }
};

export const getTemplate = (id?: string): Template => {
  if (!id) return TEMPLATES['personal']; // Fallback
  return TEMPLATES[id as TemplateType] || TEMPLATES['personal'];
};
