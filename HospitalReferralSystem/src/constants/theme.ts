import { Platform } from 'react-native';

export const Colors = {
  light: {
    primary: '#0B6B58',
    primaryDark: '#075044',
    primarySoft: '#E5F4EF',
    accent: '#D97706',
    accentSoft: '#FFF3DD',
    danger: '#C2413A',
    dangerSoft: '#FDECEA',
    info: '#2563A8',
    infoSoft: '#EAF2FB',
    text: '#17211F',
    textSecondary: '#687572',
    background: '#F5F7F6',
    surface: '#FFFFFF',
    backgroundElement: '#EDF1EF',
    backgroundSelected: '#DCEAE5',
    border: '#DDE4E1',
    white: '#FFFFFF',
  },
  dark: {
    primary: '#58C4A8',
    primaryDark: '#8ED9C6',
    primarySoft: '#173B33',
    accent: '#F0A44B',
    accentSoft: '#4B3519',
    danger: '#F18A83',
    dangerSoft: '#4A2827',
    info: '#82B5EB',
    infoSoft: '#203A55',
    text: '#F3F7F5',
    textSecondary: '#AAB6B2',
    background: '#111715',
    surface: '#18201D',
    backgroundElement: '#222C28',
    backgroundSelected: '#29453D',
    border: '#303C38',
    white: '#FFFFFF',
  },
} as const;

export type Theme = (typeof Colors)['light'];
export type ThemeColor = keyof Theme;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 32,
  eight: 40,
} as const;

export const BottomTabInset = Platform.select({ ios: 54, android: 72, web: 76 }) ?? 0;
export const MaxContentWidth = 760;
