export type ThemeId = 'classic' | 'fresh_mint' | 'sunset_warm' | 'cyber_dark' | 'lavender_dream';

export type ColorPaletteId = 'blue' | 'emerald' | 'sunset' | 'purple' | 'amber' | 'rose' | 'dark';
export type FontOptionId = 'inter' | 'jakarta' | 'outfit' | 'space' | 'playfair';
export type BackgroundOptionId = 'white' | 'slate' | 'cream' | 'dark' | 'midnight';
export type TextureOptionId = 'none' | 'dots' | 'grid' | 'stripes' | 'paper';

export interface CustomThemeConfig {
  presetId: ThemeId;
  color: ColorPaletteId;
  font: FontOptionId;
  background: BackgroundOptionId;
  texture: TextureOptionId;
}

export interface ThemePreset {
  id: ThemeId;
  name: { pt: string; en: string };
  description: { pt: string; en: string };
  color: ColorPaletteId;
  font: FontOptionId;
  background: BackgroundOptionId;
  texture: TextureOptionId;
  previewGradient: string;
}

export interface ColorScheme {
  id: ColorPaletteId;
  label: { pt: string; en: string };
  primary: string;         // e.g. #2563eb
  primaryHover: string;    // e.g. #1d4ed8
  primaryLight: string;    // e.g. #eff6ff
  primaryRing: string;     // e.g. rgba(37,99,235,0.2)
  accentHex: string;       // swatch display
}

export interface FontConfig {
  id: FontOptionId;
  label: string;
  fontFamily: string;
  previewText: string;
}

export interface BackgroundConfig {
  id: BackgroundOptionId;
  label: { pt: string; en: string };
  bodyBgClass: string;
  cardBgClass: string;
  headerBgClass: string;
  footerBgClass: string;
  textPrimaryClass: string;
  textSecondaryClass: string;
  borderClass: string;
  isDark: boolean;
  bgHex: string;
}

export interface TextureConfig {
  id: TextureOptionId;
  label: { pt: string; en: string };
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundRepeat?: string;
}

export const THEME_PRESETS: Record<ThemeId, ThemePreset> = {
  classic: {
    id: 'classic',
    name: { pt: 'Clássico', en: 'Classic' },
    description: { pt: 'O visual limpo e original do app', en: 'The clean, original app design' },
    color: 'blue',
    font: 'inter',
    background: 'white',
    texture: 'none',
    previewGradient: 'from-blue-600 to-blue-400'
  },
  fresh_mint: {
    id: 'fresh_mint',
    name: { pt: 'Hortelã Fresh', en: 'Fresh Mint' },
    description: { pt: 'Tons frescos de esmeralda e menta', en: 'Fresh emerald and mint natural tones' },
    color: 'emerald',
    font: 'jakarta',
    background: 'slate',
    texture: 'dots',
    previewGradient: 'from-emerald-600 to-teal-400'
  },
  sunset_warm: {
    id: 'sunset_warm',
    name: { pt: 'Pôr do Sol', en: 'Sunset Warm' },
    description: { pt: 'Acolhedor com tons solares e creme', en: 'Warm amber tones and cozy cream paper' },
    color: 'sunset',
    font: 'outfit',
    background: 'cream',
    texture: 'paper',
    previewGradient: 'from-orange-500 to-amber-400'
  },
  cyber_dark: {
    id: 'cyber_dark',
    name: { pt: 'Cyber Dark', en: 'Cyber Dark' },
    description: { pt: 'Modo escuro moderno e imersivo', en: 'Modern, sleek immersive dark mode' },
    color: 'purple',
    font: 'space',
    background: 'midnight',
    texture: 'grid',
    previewGradient: 'from-violet-600 to-indigo-500'
  },
  lavender_dream: {
    id: 'lavender_dream',
    name: { pt: 'Lavanda Chic', en: 'Lavender Chic' },
    description: { pt: 'Suave, sofisticado e elegante', en: 'Soft, sophisticated and elegant' },
    color: 'rose',
    font: 'playfair',
    background: 'white',
    texture: 'stripes',
    previewGradient: 'from-rose-500 to-pink-300'
  }
};

export const COLOR_OPTIONS: Record<ColorPaletteId, ColorScheme> = {
  blue: {
    id: 'blue',
    label: { pt: 'Azul Real', en: 'Royal Blue' },
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryLight: '#eff6ff',
    primaryRing: 'rgba(37,99,235,0.2)',
    accentHex: '#2563eb'
  },
  emerald: {
    id: 'emerald',
    label: { pt: 'Esmeralda', en: 'Emerald' },
    primary: '#059669',
    primaryHover: '#047857',
    primaryLight: '#ecfdf5',
    primaryRing: 'rgba(5,150,105,0.2)',
    accentHex: '#059669'
  },
  sunset: {
    id: 'sunset',
    label: { pt: 'Laranja Solar', en: 'Solar Sunset' },
    primary: '#ea580c',
    primaryHover: '#c2410c',
    primaryLight: '#fff7ed',
    primaryRing: 'rgba(234,88,12,0.2)',
    accentHex: '#ea580c'
  },
  purple: {
    id: 'purple',
    label: { pt: 'Roxo Elétrico', en: 'Electric Purple' },
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    primaryLight: '#f5f3ff',
    primaryRing: 'rgba(124,58,237,0.2)',
    accentHex: '#7c3aed'
  },
  amber: {
    id: 'amber',
    label: { pt: 'Âmbar Dourado', en: 'Warm Amber' },
    primary: '#d97706',
    primaryHover: '#b45309',
    primaryLight: '#fffbeb',
    primaryRing: 'rgba(217,119,6,0.2)',
    accentHex: '#d97706'
  },
  rose: {
    id: 'rose',
    label: { pt: 'Rosa Coral', en: 'Coral Rose' },
    primary: '#e11d48',
    primaryHover: '#be123c',
    primaryLight: '#fff1f2',
    primaryRing: 'rgba(225,29,72,0.2)',
    accentHex: '#e11d48'
  },
  dark: {
    id: 'dark',
    label: { pt: 'Grafite', en: 'Graphite' },
    primary: '#1f2937',
    primaryHover: '#111827',
    primaryLight: '#f3f4f6',
    primaryRing: 'rgba(31,41,55,0.2)',
    accentHex: '#1f2937'
  }
};

export const FONT_OPTIONS: Record<FontOptionId, FontConfig> = {
  inter: {
    id: 'inter',
    label: 'Inter (Padrão)',
    fontFamily: "'Inter', sans-serif",
    previewText: 'Aa Bb 123'
  },
  jakarta: {
    id: 'jakarta',
    label: 'Plus Jakarta',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    previewText: 'Aa Bb 123'
  },
  outfit: {
    id: 'outfit',
    label: 'Outfit (Moderno)',
    fontFamily: "'Outfit', sans-serif",
    previewText: 'Aa Bb 123'
  },
  space: {
    id: 'space',
    label: 'Space Grotesk',
    fontFamily: "'Space Grotesk', sans-serif",
    previewText: 'Aa Bb 123'
  },
  playfair: {
    id: 'playfair',
    label: 'Playfair (Clássico)',
    fontFamily: "'Playfair Display', serif",
    previewText: 'Aa Bb 123'
  }
};

export const BACKGROUND_OPTIONS: Record<BackgroundOptionId, BackgroundConfig> = {
  white: {
    id: 'white',
    label: { pt: 'Neutro Claro', en: 'Light Neutral' },
    bodyBgClass: 'bg-gray-50',
    cardBgClass: 'bg-white',
    headerBgClass: 'bg-white',
    footerBgClass: 'bg-white/95',
    textPrimaryClass: 'text-gray-900',
    textSecondaryClass: 'text-gray-500',
    borderClass: 'border-gray-100',
    isDark: false,
    bgHex: '#f9fafb'
  },
  slate: {
    id: 'slate',
    label: { pt: 'Menta Suave', en: 'Soft Mint' },
    bodyBgClass: 'bg-emerald-50/40',
    cardBgClass: 'bg-white',
    headerBgClass: 'bg-white',
    footerBgClass: 'bg-white/95',
    textPrimaryClass: 'text-emerald-950',
    textSecondaryClass: 'text-emerald-600/70',
    borderClass: 'border-emerald-100',
    isDark: false,
    bgHex: '#ecfdf5'
  },
  cream: {
    id: 'cream',
    label: { pt: 'Creme Aconchegante', en: 'Cozy Cream' },
    bodyBgClass: 'bg-[#faf6f0]',
    cardBgClass: 'bg-[#fffefc]',
    headerBgClass: 'bg-[#fffefc]',
    footerBgClass: 'bg-[#fffefc]/95',
    textPrimaryClass: 'text-[#2e261f]',
    textSecondaryClass: 'text-[#877869]',
    borderClass: 'border-[#ede5d8]',
    isDark: false,
    bgHex: '#faf6f0'
  },
  dark: {
    id: 'dark',
    label: { pt: 'Chumbo Escuro', en: 'Dark Slate' },
    bodyBgClass: 'bg-slate-900',
    cardBgClass: 'bg-slate-800',
    headerBgClass: 'bg-slate-800',
    footerBgClass: 'bg-slate-800/95',
    textPrimaryClass: 'text-slate-100',
    textSecondaryClass: 'text-slate-400',
    borderClass: 'border-slate-700/60',
    isDark: true,
    bgHex: '#0f172a'
  },
  midnight: {
    id: 'midnight',
    label: { pt: 'Cyber Meia-Noite', en: 'Cyber Midnight' },
    bodyBgClass: 'bg-[#0b0f19]',
    cardBgClass: 'bg-[#131b2e]',
    headerBgClass: 'bg-[#131b2e]',
    footerBgClass: 'bg-[#131b2e]/95',
    textPrimaryClass: 'text-indigo-50',
    textSecondaryClass: 'text-indigo-300/60',
    borderClass: 'border-indigo-900/40',
    isDark: true,
    bgHex: '#0b0f19'
  }
};

export const TEXTURE_OPTIONS: Record<TextureOptionId, TextureConfig> = {
  none: {
    id: 'none',
    label: { pt: 'Sem Textura (Liso)', en: 'Smooth (None)' },
  },
  dots: {
    id: 'dots',
    label: { pt: 'Pontilhado Suave', en: 'Soft Dots' },
    backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
    backgroundSize: '16px 16px'
  },
  grid: {
    id: 'grid',
    label: { pt: 'Grade Sutil', en: 'Subtle Grid' },
    backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
    backgroundSize: '24px 24px'
  },
  stripes: {
    id: 'stripes',
    label: { pt: 'Linhas Diagonais', en: 'Diagonal Lines' },
    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)',
    backgroundSize: 'auto'
  },
  paper: {
    id: 'paper',
    label: { pt: 'Papel Granulado', en: 'Paper Grain' },
    backgroundImage: 'radial-gradient(circle at 50% 50%, currentColor 0.5px, transparent 1px)',
    backgroundSize: '8px 8px'
  }
};

export const DEFAULT_THEME_CONFIG: CustomThemeConfig = {
  presetId: 'classic',
  color: 'blue',
  font: 'inter',
  background: 'white',
  texture: 'none'
};
