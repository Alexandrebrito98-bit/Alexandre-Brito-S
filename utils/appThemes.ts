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
    sectionTitle: string;  // Títulos de seção sóbrios (cinza-azulado escuro)
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
      pt: 'Azul-aço sóbrio',
      en: 'Subtle steel blue'
    },
    isDark: false,
    colors: {
      background: '#F8FAFC',
      card: '#F8FAFC',
      inputBg: '#E2E8F0', // Cinza-azulado claro (um tom acima do fundo da tela)
      deleteBg: '#FCE9E5', // Fundo vermelho bem claro
      deleteText: '#DC2626', // Ícone vermelho
      primary: '#3F6AB8', // Azul-aço sóbrio e menos saturado
      primaryHover: '#335697',
      primaryLight: '#EDF2FA',
      accent: '#557DBF',
      warning: '#F59E0B',
      sectionTitle: '#334155', // Cinza-azulado escuro (Slate 700) com contraste nítido e elegante
      text: '#0F172A',
      textSecondary: '#64748B',
      border: 'transparent',
      // Mini-cards de itens da lista
      itemCardBg: 'rgba(255, 255, 255, 0.75)',
      itemCardBorder: 'rgba(15, 23, 42, 0.08)',
      chipAllBg: '#0F172A',
      chipAllText: '#FFFFFF',
      chipAvailableBg: '#EDF2FA',
      chipAvailableText: '#335697',
      chipPurchasedBg: '#DCFCE7',
      chipPurchasedText: '#15803D',
      chipUnavailableBg: '#FEF3C7',
      chipUnavailableText: '#B45309',
      totalCardBg: '#2A3F66', // Azul-aço escuro e sóbrio com legibilidade máxima
      totalCardText: '#FFFFFF',
      totalCardSubtext: 'rgba(255, 255, 255, 0.78)',
      totalCardProgressTrack: 'rgba(255, 255, 255, 0.28)', // Trilho contrastante visível
      totalCardProgressBar: '#7CA3E2', // Barra de destaque em azul-aço suave
      footerProgressTrack: 'rgba(255, 255, 255, 0.28)',
      footerProgressBar: '#7CA3E2'
    },
    preview: {
      background: '#F8FAFC',
      card: '#E2E8F0',
      primary: '#3F6AB8',
      accent: '#7CA3E2',
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
      sectionTitle: '#1F5C3F', // Verde floresta profundo elegante
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
