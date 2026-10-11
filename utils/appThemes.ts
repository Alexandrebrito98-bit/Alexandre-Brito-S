export type AppThemeId = 'classic' | 'forest';

export interface AppThemeConfig {
  id: AppThemeId;
  name: {
    pt: string;
    en: string;
  };
  subtitle: {
    pt: string;
    en: string;
  };
  isDark: boolean;
  colors: {
    background: string;
    card: string;
    primary: string;
    primaryHover: string;
    primaryLight: string;
    accent: string;
    warning: string;
    text: string;
    textSecondary: string;
    border: string;
    // Chips derived from primary and theme palette
    chipAllBg: string;
    chipAllText: string;
    chipAvailableBg: string;
    chipAvailableText: string;
    chipPurchasedBg: string;
    chipPurchasedText: string;
    chipUnavailableBg: string;
    chipUnavailableText: string;
  };
  preview: {
    background: string;
    card: string;
    primary: string;
    accent: string;
    border: string;
  };
}

export const APP_THEMES: Record<AppThemeId, AppThemeConfig> = {
  classic: {
    id: 'classic',
    name: {
      pt: 'Clássico',
      en: 'Classic'
    },
    subtitle: {
      pt: 'Padrão original',
      en: 'Original default'
    },
    isDark: false,
    colors: {
      background: '#F9FAFB', // gray-50
      card: '#FFFFFF',
      primary: '#2563EB', // blue-600
      primaryHover: '#1D4ED8',
      primaryLight: '#EFF6FF',
      accent: '#3B82F6',
      warning: '#F59E0B',
      text: '#111827', // gray-900
      textSecondary: '#6B7280', // gray-500
      border: '#E5E7EB', // gray-200
      chipAllBg: '#111827',
      chipAllText: '#FFFFFF',
      chipAvailableBg: '#EFF6FF',
      chipAvailableText: '#1D4ED8',
      chipPurchasedBg: '#DCFCE7',
      chipPurchasedText: '#15803D',
      chipUnavailableBg: '#FEF3C7',
      chipUnavailableText: '#B45309'
    },
    preview: {
      background: '#F9FAFB',
      card: '#FFFFFF',
      primary: '#2563EB',
      accent: '#3B82F6',
      border: '#E5E7EB'
    }
  },
  forest: {
    id: 'forest',
    name: {
      pt: 'Floresta',
      en: 'Forest'
    },
    subtitle: {
      pt: 'Claro natural',
      en: 'Natural light'
    },
    isDark: false,
    colors: {
      background: '#F4F7F4',
      card: '#FFFFFF',
      primary: '#1F5C3F',
      primaryHover: '#174831',
      primaryLight: '#E8F3ED',
      accent: '#E4572E',
      warning: '#F2B544',
      text: '#1B2A22',
      textSecondary: '#4A5B52',
      border: '#DCE5DF',
      chipAllBg: '#1F5C3F',
      chipAllText: '#FFFFFF',
      chipAvailableBg: '#E8F3ED',
      chipAvailableText: '#1F5C3F',
      chipPurchasedBg: '#D1E7DD',
      chipPurchasedText: '#14462E',
      chipUnavailableBg: '#FDF0D5',
      chipUnavailableText: '#9A6B0A'
    },
    preview: {
      background: '#F4F7F4',
      card: '#FFFFFF',
      primary: '#1F5C3F',
      accent: '#E4572E',
      border: '#DCE5DF'
    }
  }
};

export const DEFAULT_APP_THEME: AppThemeId = 'classic';
