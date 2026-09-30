export interface Variant {
  id: string;
  label: string;
  verticalAlign: 'center' | 'bottom' | 'top';
  textAlign: 'left' | 'center' | 'right';
  fontScale: number; // Multiplier relative to screen width
  fontWeight: "normal" | "bold";
  opacity: number;
  letterSpacing: string;
  offsetY: number; // % of height
  lineHeight: number;
}

export const VARIANTS: Record<string, Variant> = {
  'top-left': {
    id: 'top-left',
    label: 'Top Left',
    verticalAlign: 'top',
    textAlign: 'left',
    fontScale: 1.0, 
    fontWeight: "normal",
    opacity: 0.9,
    letterSpacing: '0.02em',
    offsetY: 10,
    lineHeight: 1.4,
  },
  'top-center': {
    id: 'top-center',
    label: 'Top Center',
    verticalAlign: 'top',
    textAlign: 'center',
    fontScale: 1.0, 
    fontWeight: "normal",
    opacity: 0.9,
    letterSpacing: '0.02em',
    offsetY: 10,
    lineHeight: 1.4,
  },
  'top-right': {
    id: 'top-right',
    label: 'Top Right',
    verticalAlign: 'top',
    textAlign: 'right',
    fontScale: 1.0, 
    fontWeight: "normal",
    opacity: 0.9,
    letterSpacing: '0.02em',
    offsetY: 10,
    lineHeight: 1.4,
  },
  'center-left': {
    id: 'center-left',
    label: 'Middle Left',
    verticalAlign: 'center',
    textAlign: 'left',
    fontScale: 1.0, 
    fontWeight: "normal",
    opacity: 0.9,
    letterSpacing: '0.02em',
    offsetY: 0,
    lineHeight: 1.4,
  },
  'center-center': {
    id: 'center-center',
    label: 'Middle Center',
    verticalAlign: 'center',
    textAlign: 'center',
    fontScale: 1.0, 
    fontWeight: "normal",
    opacity: 0.9,
    letterSpacing: '0.02em',
    offsetY: 0,
    lineHeight: 1.4,
  },
  'center-right': {
    id: 'center-right',
    label: 'Middle Right',
    verticalAlign: 'center',
    textAlign: 'right',
    fontScale: 1.0, 
    fontWeight: "normal",
    opacity: 0.9,
    letterSpacing: '0.02em',
    offsetY: 0,
    lineHeight: 1.4,
  },
  'bottom-left': {
    id: 'bottom-left',
    label: 'Bottom Left',
    verticalAlign: 'bottom',
    textAlign: 'left',
    fontScale: 1.0, 
    fontWeight: "normal",
    opacity: 0.9,
    letterSpacing: '0.02em',
    offsetY: -10,
    lineHeight: 1.4,
  },
  'bottom-center': {
    id: 'bottom-center',
    label: 'Bottom Center',
    verticalAlign: 'bottom',
    textAlign: 'center',
    fontScale: 1.0, 
    fontWeight: "normal",
    opacity: 0.9,
    letterSpacing: '0.02em',
    offsetY: -10,
    lineHeight: 1.4,
  },
  'bottom-right': {
    id: 'bottom-right',
    label: 'Bottom Right',
    verticalAlign: 'bottom',
    textAlign: 'right',
    fontScale: 1.0, 
    fontWeight: "normal",
    opacity: 0.9,
    letterSpacing: '0.02em',
    offsetY: -10,
    lineHeight: 1.4,
  },
};

export const getVariant = (id: string): Variant => VARIANTS[id] || VARIANTS['center-center'];
