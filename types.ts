import type { CustomThemeConfig } from './utils/themePresets';
import type { AppThemeId } from './utils/appThemes';

export type TextSize = 'small' | 'medium' | 'large';

export enum SortMode {
  NameAZ = 'NameAZ',
  PriceAsc = 'PriceAsc',
  PriceDesc = 'PriceDesc',
  Newest = 'Newest',
  Category = 'Category'
}

export type ViewSortOption = 'alphabetical' | 'value' | 'category' | 'last_modified';

export type FilterStatus = 'all' | 'pending' | 'purchased' | 'unavailable';

export interface Market {
  id: string;
  name: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  isAvailable: boolean;
  isPurchased: boolean;
  addedAt: number;
  marketId?: string;
}

export type SwipeAction = 'purchase' | 'unavailable' | 'delete' | 'market' | 'none';

export interface SavedList {
  id: string;
  date: number;
  totalItems: number;
  totalValue: number;
  items: ShoppingItem[];
}

export interface ShoppingList {
  id: string;
  name: string;
  icon?: string;
  createdAt: number;
  items: ShoppingItem[];
  searchTerm?: string;
  savedHistory?: SavedList[];
}

export type Language = 'pt' | 'en';

export interface FavoriteProduct {
  id: string;
  name: string;
  defaultQuantity?: number;
  defaultUnitPrice?: number;
}

export interface AppSettings {
  language?: Language;
  theme?: AppThemeId | CustomThemeConfig;
  textSize: TextSize;
  sortMode: SortMode;
  isBudgetModeActive: boolean;
  budgetLimit: number;
  currency: string;
  isSwipeEnabled: boolean;
  rightSwipeAction: SwipeAction;
  leftSwipeAction: SwipeAction;
  savedHistory: SavedList[];
  isOrganizeByMarketEnabled?: boolean;
  markets?: Market[];
  favorites?: FavoriteProduct[];
}

