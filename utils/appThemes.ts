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
    inputBg: string;       // Fundo dos campos e botões (um tom acima do fundo da tela)
    deleteBg: string;      // Fundo vermelho bem claro
    deleteText: string;    // Ícone/texto vermelho de exclusão
    primary: string;
    primaryHover: string;
    primaryLight: string;
    accent: string;
    warning: string;
    text: string;
    textSecondary: string;
    border: string;
    // Mini-cards de itens da lista
    itemCardBg: string;
    itemCardBorder: string;
    // Chips derived from primary and theme palette
    chipAllBg: string;
    chipAllText: string;
    chipAvailableBg: string;
    chipAvailableText: string;
    chipPurchasedBg: string;
    chipPurchasedText: string;
    chipUnavailableBg: string;
    chipUnavailableText: string;
    // Rodapé Total Estimado
    totalCardBg: string;
    totalCardText: string;
    totalCardSubtext: string;
    totalCardProgressTrack: string;
    totalCardProgressBar: string;
    footerProgressTrack: string;
    footerProgressBar: string;
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
      background: '#F8FAFC',
      card: '#F8FAFC',
      inputBg: '#E2E8F0', // Cinza-azulado claro (um tom acima do fundo da tela)
      deleteBg: '#FCE9E5', // Fundo vermelho bem claro
      deleteText: '#DC2626', // Ícone vermelho
      primary: '#2563EB', // Azul clássico
      primaryHover: '#1D4ED8',
      primaryLight: '#EFF6FF',
      accent: '#3B82F6',
      warning: '#F59E0B',
      text: '#0F172A',
      textSecondary: '#64748B',
      border: 'transparent',
      // Mini-cards de itens da lista
      itemCardBg: 'rgba(255, 255, 255, 0.75)',
      itemCardBorder: 'rgba(15, 23, 42, 0.08)',
      chipAllBg: '#0F172A',
      chipAllText: '#FFFFFF',
      chipAvailableBg: '#EFF6FF',
      chipAvailableText: '#1D4ED8',
      chipPurchasedBg: '#DCFCE7',
      chipPurchasedText: '#15803D',
      chipUnavailableBg: '#FEF3C7',
      chipUnavailableText: '#B45309',
      totalCardBg: '#1E3A8A', // Bloco arredondado azul-escuro
      totalCardText: '#FFFFFF',
      totalCardSubtext: 'rgba(255, 255, 255, 0.75)',
      totalCardProgressTrack: 'rgba(255, 255, 255, 0.38)', // Trilho contrastante visível com 0 itens
      totalCardProgressBar: '#38BDF8', // Barra em azul-claro de destaque
      footerProgressTrack: 'rgba(255, 255, 255, 0.38)',
      footerProgressBar: '#38BDF8'
    },
    preview: {
      background: '#F8FAFC',
      card: '#E2E8F0',
      primary: '#2563EB',
      accent: '#38BDF8',
      border: 'transparent'
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
      background: '#F4F7F4', // Fundo #F4F7F4
      card: '#F4F7F4',
      inputBg: '#E6EEE8', // Campos e botões #E6EEE8 (um tom acima do fundo)
      deleteBg: '#FCE9E5', // Excluir fundo #FCE9E5 (vermelho bem claro)
      deleteText: '#DC2626', // Ícone vermelho
      primary: '#1F5C3F', // Primária sólida #1F5C3F
      primaryHover: '#174831',
      primaryLight: '#E6EEE8',
      accent: '#E4572E',
      warning: '#F2B544',
      text: '#1B2A22',
      textSecondary: '#4A5B52',
      border: 'transparent',
      // Mini-cards de itens da lista
      itemCardBg: 'rgba(255, 255, 255, 0.65)',
      itemCardBorder: 'rgba(31, 92, 63, 0.12)',
      chipAllBg: '#1F5C3F',
      chipAllText: '#FFFFFF',
      chipAvailableBg: '#E6EEE8',
      chipAvailableText: '#1F5C3F',
      chipPurchasedBg: '#D1E7DD',
      chipPurchasedText: '#14462E',
      chipUnavailableBg: '#FDF0D5',
      chipUnavailableText: '#9A6B0A',
      totalCardBg: '#1F5C3F', // Bloco arredondado verde-escuro
      totalCardText: '#FFFFFF',
      totalCardSubtext: 'rgba(255, 255, 255, 0.75)',
      totalCardProgressTrack: 'rgba(255, 255, 255, 0.38)', // Trilho contrastante visível com 0 itens
      totalCardProgressBar: '#FACC15', // Amarelo vibrante como na imagem de referência
      footerProgressTrack: 'rgba(255, 255, 255, 0.38)',
      footerProgressBar: '#FACC15'
    },
    preview: {
      background: '#F4F7F4',
      card: '#E6EEE8',
      primary: '#1F5C3F',
      accent: '#FACC15',
      border: 'transparent'
    }
  }
};

export const DEFAULT_APP_THEME: AppThemeId = 'classic';
