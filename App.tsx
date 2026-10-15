import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ShoppingItem, SortMode, AppSettings, FilterStatus, SavedList, ViewSortOption, ShoppingList } from './types';
import { Header } from './components/Header';
import { ItemCard } from './components/ItemCard';
import { SettingsModal } from './components/SettingsModal';
import { ExportModal } from './components/ExportModal';
import { ListMenuModal } from './components/ListMenuModal';
import { ChevronUp, Check, SlidersHorizontal, ArrowUpDown, DollarSign, Shapes, Clock, Maximize2, ArrowLeft, ChevronDown, Plus } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useKeyboardAvoidance } from './hooks/useKeyboardAvoidance';
import { getTranslation } from './i18n';
import { detectCategory, getCategoryDisplayName, CategoryDefinition } from './utils/categoryDetector';
import { 
  DEFAULT_THEME_CONFIG, 
  COLOR_OPTIONS, 
  FONT_OPTIONS, 
  BACKGROUND_OPTIONS, 
  TEXTURE_OPTIONS 
} from './utils/themePresets';
import { APP_THEMES, AppThemeId, DEFAULT_APP_THEME, AppThemeConfig } from './utils/appThemes';
import { useAuth } from './components/AuthGate';
import { supabase, isSupabaseConfigured } from './supabase';

const MULTI_LISTS_KEY = 'superlist_multi_lists';
const ACTIVE_LIST_KEY = 'superlist_active_list_id';
const STORAGE_KEY = 'superlist_data';
const SETTINGS_KEY = 'superlist_settings';
const VIEW_SORT_KEY = 'superlist_view_sort_mode';

const App: React.FC = () => {
  const { user, userName, userEmail, signOut, isOfflineMode } = useAuth();
  const isInitialSyncDoneRef = useRef(false);
  const saveDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [lists, setLists] = useState<ShoppingList[]>(() => {
    try {
      const saved = localStorage.getItem(MULTI_LISTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Se o usuário já tiver uma lista com o nome antigo "Minha Lista", renomeie para "Mercado"
          return parsed.map((l: ShoppingList) => {
            if (l.name === 'Minha Lista') {
              return { ...l, name: 'Mercado' };
            }
            return l;
          });
        }
      }
    } catch (e) {}

    let legacyItems: ShoppingItem[] = [];
    try {
      const savedLegacy = localStorage.getItem(STORAGE_KEY);
      if (savedLegacy) legacyItems = JSON.parse(savedLegacy);
    } catch (e) {}

    let legacyHistory: SavedList[] = [];
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        if (Array.isArray(parsedSettings.savedHistory)) {
          legacyHistory = parsedSettings.savedHistory;
        }
      }
    } catch (e) {}

    return [
      {
        id: 'default',
        name: 'Mercado',
        icon: '🛒',
        createdAt: Date.now(),
        items: legacyItems,
        searchTerm: '',
        savedHistory: legacyHistory
      }
    ];
  });

  const [activeListId, setActiveListId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_LIST_KEY);
      if (savedId) return savedId;
    } catch (e) {}
    return 'default';
  });

  const [showListMenu, setShowListMenu] = useState(false);

  const activeList = useMemo(() => {
    const found = lists.find(l => l.id === activeListId);
    if (found) return found;
    return lists[0] || {
      id: 'default',
      name: 'Mercado',
      icon: '🛒',
      createdAt: Date.now(),
      items: [],
      searchTerm: '',
      savedHistory: []
    };
  }, [lists, activeListId]);

  const items = useMemo(() => activeList.items || [], [activeList.items]);

  const setItems = useCallback((updater: ShoppingItem[] | ((prev: ShoppingItem[]) => ShoppingItem[])) => {
    setLists(prevLists => {
      return prevLists.map(list => {
        if (list.id === activeList.id) {
          const currentListItems = list.items || [];
          const nextItems = typeof updater === 'function' ? updater(currentListItems) : updater;
          return { ...list, items: nextItems };
        }
        return list;
      });
    });
  }, [activeList.id]);

  const [settings, setSettings] = useState<AppSettings>({
    language: 'pt',
    theme: DEFAULT_APP_THEME,
    textSize: 'small',
    sortMode: SortMode.NameAZ,
    isBudgetModeActive: false,
    budgetLimit: 0,
    currency: '€',
    isSwipeEnabled: true,
    rightSwipeAction: 'purchase',
    leftSwipeAction: 'unavailable',
    savedHistory: [],
  });
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [isViewMode, setIsViewMode] = useState(false);
  const [viewSortOption, setViewSortOption] = useState<ViewSortOption>('alphabetical');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isCategorySummaryOpen, setIsCategorySummaryOpen] = useState(false);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Record<string, boolean>>({});

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategoryIds(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState<string>(''); 
  const [newItemPrice, setNewItemPrice] = useState<string>(''); 
  
  // Estados para status pré-definido
  const [isNewItemPurchased, setIsNewItemPurchased] = useState(false);
  const [isNewItemUnavailable, setIsNewItemUnavailable] = useState(false);

  const [searchTerm, setSearchTerm] = useState(() => activeList.searchTerm || '');

  useEffect(() => {
    setSearchTerm(activeList.searchTerm || '');
  }, [activeList.id]);

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setLists(prevLists => prevLists.map(list => 
      list.id === activeList.id ? { ...list, searchTerm: term } : list
    ));
  };
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [deletedItemInfo, setDeletedItemInfo] = useState<{ item: ShoppingItem; originalIndex: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [historyAddedMap, setHistoryAddedMap] = useState<Record<string, { wasExisting: boolean }>>({});
  const [editingItemState, setEditingItemState] = useState<{
    active: boolean;
    mode?: 'hold' | 'edit';
  }>({ active: false });

  const handleItemEditingChange = useCallback((active: boolean, mode: 'hold' | 'edit' = 'edit') => {
    setEditingItemState({ active, mode });
  }, []);

  useEffect(() => {
    const handleCustomEditing = (e: Event) => {
      const customEvent = e as CustomEvent<{ active: boolean; mode?: 'hold' | 'edit' }>;
      if (customEvent.detail) {
        setEditingItemState(customEvent.detail);
      }
    };
    window.addEventListener('superlist:item-editing', handleCustomEditing);
    return () => {
      window.removeEventListener('superlist:item-editing', handleCustomEditing);
    };
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { isKeyboardActive, keyboardSpacerHeight } = useKeyboardAvoidance();

  const currentLang = settings.language || 'pt';
  const t = getTranslation(currentLang);
  const locale = currentLang === 'en' ? 'en-US' : 'pt-BR';

  // Resolução do Tema Ativo (Clássico, Floresta, Noturno, Lavanda)
  const activeThemeId: AppThemeId = useMemo(() => {
    if (typeof settings.theme === 'string' && settings.theme in APP_THEMES) {
      return settings.theme as AppThemeId;
    }
    return DEFAULT_APP_THEME;
  }, [settings.theme]);

  const activeAppTheme: AppThemeConfig = APP_THEMES[activeThemeId] || APP_THEMES[DEFAULT_APP_THEME];

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = currentLang === 'en' ? 'en' : 'pt-BR';
      
      // Aplica as variáveis CSS de cor em :root para todo o aplicativo
      const root = document.documentElement;
      root.style.setProperty('--color-theme-bg', activeAppTheme.colors.background);
      root.style.setProperty('--color-theme-card', activeAppTheme.colors.card);
      root.style.setProperty('--color-theme-primary', activeAppTheme.colors.primary);
      root.style.setProperty('--color-theme-primary-hover', activeAppTheme.colors.primaryHover);
      root.style.setProperty('--color-theme-primary-light', activeAppTheme.colors.primaryLight);
      root.style.setProperty('--color-theme-accent', activeAppTheme.colors.accent);
      root.style.setProperty('--color-theme-warning', activeAppTheme.colors.warning);
      root.style.setProperty('--color-theme-text', activeAppTheme.colors.text);
      root.style.setProperty('--color-theme-text-secondary', activeAppTheme.colors.textSecondary);
      root.style.setProperty('--color-theme-border', activeAppTheme.colors.border);
      
      // Meta theme-color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', activeAppTheme.colors.primary);
      }
    }
  }, [currentLang, activeAppTheme]);

  // Close sort menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };
    if (isSortMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortMenuOpen]);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalValue = useMemo(() => items.filter(i => i.isAvailable).reduce((acc, curr) => acc + (curr.unitPrice * curr.quantity), 0), [items]);
  const purchasedItemsCount = useMemo(() => items.filter(i => i.isAvailable && i.isPurchased).length, [items]);
  const totalAvailableItemsCount = useMemo(() => {
    const available = items.filter(i => i.isAvailable).length;
    return available > 0 ? available : items.length;
  }, [items]);
  const purchaseProgressPercentage = useMemo(() => {
    if (totalAvailableItemsCount === 0) return 0;
    return Math.min(100, Math.round((purchasedItemsCount / totalAvailableItemsCount) * 100));
  }, [purchasedItemsCount, totalAvailableItemsCount]);

  const saveToHistory = useCallback((clearAfterSave: boolean = false) => {
    if (items.length === 0) return;

    const newList: SavedList = {
      id: crypto.randomUUID(),
      date: Date.now(),
      totalItems: items.length,
      totalValue: totalValue,
      items: [...items]
    };

    setLists(prevLists => prevLists.map(list => {
      if (list.id === activeList.id) {
        return {
          ...list,
          savedHistory: [newList, ...(list.savedHistory || [])],
          items: clearAfterSave ? [] : list.items
        };
      }
      return list;
    }));

    if (clearAfterSave) {
      showToast(t.listSavedAndCleared);
    } else {
      showToast(t.listSavedToHistory);
    }

    setShowExportModal(false);
  }, [items, totalValue, activeList.id, showToast, t]);

  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    const savedViewSort = localStorage.getItem(VIEW_SORT_KEY);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings) as Partial<AppSettings>;
      setSettings(prev => ({ 
        ...prev, 
        ...parsed, 
        currency: parsed.currency === 'R$' ? '€' : (parsed.currency || '€') 
      }));
    }
    if (savedViewSort && ['alphabetical', 'value', 'category', 'last_modified'].includes(savedViewSort)) {
      setViewSortOption(savedViewSort as ViewSortOption);
    }

    // Migração de segurança: renomear qualquer lista 'Minha Lista' para 'Mercado'
    setLists(prev => {
      const hasOldName = prev.some(l => l.name === 'Minha Lista');
      if (hasOldName) {
        return prev.map(l => l.name === 'Minha Lista' ? { ...l, name: 'Mercado' } : l);
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(MULTI_LISTS_KEY, JSON.stringify(lists));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activeList.items || []));
  }, [lists, activeList]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_LIST_KEY, activeListId);
  }, [activeListId]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(VIEW_SORT_KEY, viewSortOption);
  }, [viewSortOption]);

  // Carregamento inicial dos dados da nuvem do Supabase na tabela public.user_data
  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured || isOfflineMode) {
      isInitialSyncDoneRef.current = true;
      return;
    }

    let isMounted = true;

    const loadUserData = async () => {
      try {
        const { data, error } = await supabase
          .from('user_data')
          .select('data, updated_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (error) {
          console.warn('Aviso ao carregar dados do usuário no Supabase:', error.message);
        }

        if (data && data.data && typeof data.data === 'object') {
          const remote = data.data as any;
          if (Array.isArray(remote.lists) && remote.lists.length > 0) {
            setLists(remote.lists);
          }
          if (remote.activeListId) {
            setActiveListId(remote.activeListId);
          }
          if (remote.settings) {
            setSettings(prev => ({ ...prev, ...remote.settings }));
          }
          if (remote.viewSortOption) {
            setViewSortOption(remote.viewSortOption);
          }
        } else {
          // Se existirem dados locais e o usuário não tiver linha na tabela, envia-os na primeira vez
          try {
            await supabase.from('user_data').upsert({
              user_id: user.id,
              data: {
                lists,
                activeListId,
                settings,
                viewSortOption
              },
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
          } catch (upsertErr) {
            console.warn('Erro ao inicializar dados na nuvem:', upsertErr);
          }
        }
      } catch (err) {
        console.error('Falha na sincronização inicial com Supabase:', err);
      } finally {
        if (isMounted) {
          isInitialSyncDoneRef.current = true;
        }
      }
    };

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, isOfflineMode]);

  // Sincronização automática com debounce de 1 segundo para a tabela public.user_data
  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured || isOfflineMode || !isInitialSyncDoneRef.current) {
      return;
    }

    if (saveDebounceTimerRef.current) {
      clearTimeout(saveDebounceTimerRef.current);
    }

    saveDebounceTimerRef.current = setTimeout(async () => {
      try {
        await supabase.from('user_data').upsert({
          user_id: user.id,
          data: {
            lists,
            activeListId,
            settings,
            viewSortOption
          },
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      } catch (err) {
        console.warn('Erro no salvamento automático para o Supabase:', err);
      }
    }, 1000);

    return () => {
      if (saveDebounceTimerRef.current) {
        clearTimeout(saveDebounceTimerRef.current);
      }
    };
  }, [lists, activeListId, settings, viewSortOption, user?.id, isOfflineMode]);

  const handleSelectList = useCallback((id: string) => {
    setActiveListId(id);
    const target = lists.find(l => l.id === id);
    if (target) {
      setSearchTerm(target.searchTerm || '');
    }
  }, [lists]);

  const handleCreateList = useCallback((name: string, icon?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newList: ShoppingList = {
      id: crypto.randomUUID(),
      name: trimmed,
      icon: icon || '🛒',
      createdAt: Date.now(),
      items: [],
      searchTerm: '',
      savedHistory: []
    };
    setLists(prev => [newList, ...prev]);
    setActiveListId(newList.id);
    setSearchTerm('');
    showToast(t.listCreated(newList.name));
  }, [showToast, t]);

  const handleRenameList = useCallback((id: string, name: string, icon?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLists(prev => prev.map(l => l.id === id ? { ...l, name: trimmed, icon: icon || l.icon } : l));
    showToast(t.listRenamed(trimmed));
  }, [showToast, t]);

  const handleDeleteList = useCallback((id: string) => {
    if (lists.length <= 1) {
      showToast(t.cannotDeleteOnlyList);
      return;
    }
    const target = lists.find(l => l.id === id);
    const targetName = target?.name || '';
    setLists(prev => {
      const remaining = prev.filter(l => l.id !== id);
      if (activeListId === id && remaining.length > 0) {
        setActiveListId(remaining[0].id);
        setSearchTerm(remaining[0].searchTerm || '');
      }
      return remaining;
    });
    showToast(t.listDeleted(targetName));
  }, [lists, activeListId, showToast, t]);

  const handleUpdateActiveListHistory = useCallback((newHistory: SavedList[]) => {
    setLists(prev => prev.map(l => l.id === activeList.id ? { ...l, savedHistory: newHistory } : l));
  }, [activeList.id]);

  const handleDeleteItem = useCallback((itemToDelete: ShoppingItem) => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }

    const originalIndex = items.findIndex(i => i.id === itemToDelete.id);
    setDeletedItemInfo({ 
      item: itemToDelete, 
      originalIndex: originalIndex >= 0 ? originalIndex : 0 
    });

    setItems(prev => prev.filter(i => i.id !== itemToDelete.id));

    undoTimerRef.current = setTimeout(() => {
      setDeletedItemInfo(null);
    }, 3000);
  }, [items]);

  const handleUndoDelete = useCallback(() => {
    if (!deletedItemInfo) return;
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    setItems(prev => {
      const next = [...prev];
      const targetIdx = Math.min(deletedItemInfo.originalIndex, next.length);
      next.splice(targetIdx, 0, deletedItemInfo.item);
      return next;
    });

    showToast(t.itemRestored(deletedItemInfo.item.name));
    setDeletedItemInfo(null);
  }, [deletedItemInfo, showToast, t]);

  // Função para o botão de Comprado (ícone de carrinho)
  const handlePurchasedButtonClick = () => {
    const rawName = newItemName.trim();
    
    // Se o usuário informou o nome do produto
    if (rawName) {
      const parsedQty = parseInt(newItemQty, 10);
      const validQty = !isNaN(parsedQty) && parsedQty > 0 ? parsedQty : 1;
      const parsedPrice = parseFloat(newItemPrice.replace(',', '.'));
      const validPrice = !isNaN(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0;

      const existing = items.find(i => i.name.toLowerCase() === rawName.toLowerCase());

      if (existing) {
        // Atualiza o item existente com os dados informados, sem duplicar
        setItems(prev => prev.map(item => 
          item.id === existing.id 
            ? { 
                ...item, 
                quantity: validQty,
                unitPrice: validPrice > 0 ? validPrice : item.unitPrice,
                isPurchased: true, 
                isAvailable: true,
                addedAt: Date.now()
              } 
            : item
        ));

        setNewItemName('');
        setNewItemQty('');
        setNewItemPrice('');
        setIsNewItemPurchased(false);
        setIsNewItemUnavailable(false);
        setFeedback(t.itemMarkedPurchased(existing.name));
        setTimeout(() => setFeedback(null), 2000);
        inputRef.current?.focus();
        return;
      } else {
        // Não existe na lista: adiciona normalmente já como comprado
        const newItem: ShoppingItem = {
          id: crypto.randomUUID(),
          name: rawName.charAt(0).toUpperCase() + rawName.slice(1),
          quantity: validQty,
          unitPrice: validPrice,
          isAvailable: true,
          isPurchased: true,
          addedAt: Date.now()
        };
        setItems(prev => [newItem, ...prev]);

        setNewItemName('');
        setNewItemQty('');
        setNewItemPrice('');
        setIsNewItemPurchased(false);
        setIsNewItemUnavailable(false);
        setFeedback(t.itemMarkedPurchased(newItem.name));
        setTimeout(() => setFeedback(null), 2000);
        inputRef.current?.focus();
        return;
      }
    }

    // Se o campo de nome estiver vazio, alterna o estado do botão
    setIsNewItemPurchased(!isNewItemPurchased);
    if (!isNewItemPurchased) {
      setIsNewItemUnavailable(false);
    }
  };

  const addItem = useCallback(() => {
    const name = newItemName.trim();
    if (!name) return;

    const parsedQty = parseInt(newItemQty, 10);
    const validQty = !isNaN(parsedQty) && parsedQty > 0 ? parsedQty : 1;
    const price = parseFloat(newItemPrice.replace(',', '.'));
    const validPrice = !isNaN(price) && price >= 0 ? price : 0;

    // Verificar se já existe (case-insensitive)
    const existing = items.find(i => i.name.toLowerCase() === name.toLowerCase());
    
    if (existing) {
      if (isNewItemPurchased) {
        setItems(prev => prev.map(item => 
          item.id === existing.id 
            ? { 
                ...item, 
                quantity: validQty,
                unitPrice: validPrice > 0 ? validPrice : item.unitPrice,
                isPurchased: true, 
                isAvailable: true,
                addedAt: Date.now()
              } 
            : item
        ));
        
        setNewItemName('');
        setNewItemQty('');
        setNewItemPrice('');
        setIsNewItemPurchased(false);
        setIsNewItemUnavailable(false);

        setFeedback(t.itemMarkedPurchased(existing.name));
        setTimeout(() => setFeedback(null), 2000);
        inputRef.current?.focus();
        return;
      }

      setFeedback(t.itemAlreadyInList);
      setTimeout(() => setFeedback(null), 2000);
      return;
    }

    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name: name.charAt(0).toUpperCase() + name.slice(1),
      quantity: validQty,
      unitPrice: validPrice,
      isAvailable: !isNewItemUnavailable,
      isPurchased: isNewItemPurchased,
      addedAt: Date.now()
    };
    setItems(prev => [newItem, ...prev]);
    
    // Reset de campos e status
    setNewItemName(''); 
    setNewItemQty('');
    setNewItemPrice('');
    setIsNewItemPurchased(false);
    setIsNewItemUnavailable(false);
    
    inputRef.current?.focus();
  }, [newItemName, newItemQty, newItemPrice, items, isNewItemPurchased, isNewItemUnavailable, t]);

  const handleAddItemFromSettings = useCallback((itemData: { name: string; quantity?: number; unitPrice?: number }, fromHistory?: boolean) => {
    const rawName = itemData.name.trim();
    if (!rawName) return;
    const qty = itemData.quantity && itemData.quantity > 0 ? itemData.quantity : 1;
    const price = itemData.unitPrice && itemData.unitPrice >= 0 ? itemData.unitPrice : 0;
    const lowerName = rawName.toLowerCase();

    setItems(prev => {
      const existing = prev.find(i => i.name.toLowerCase() === lowerName);
      if (fromHistory) {
        setHistoryAddedMap(m => ({
          ...m,
          [lowerName]: { wasExisting: Boolean(existing) }
        }));
      }
      if (existing) {
        return prev.map(i => i.id === existing.id ? {
          ...i,
          quantity: i.quantity + qty,
          unitPrice: price > 0 ? price : i.unitPrice,
          isAvailable: true,
          addedAt: Date.now()
        } : i);
      }
      const newItem: ShoppingItem = {
        id: crypto.randomUUID(),
        name: rawName.charAt(0).toUpperCase() + rawName.slice(1),
        quantity: qty,
        unitPrice: price,
        isAvailable: true,
        isPurchased: false,
        addedAt: Date.now()
      };
      return [newItem, ...prev];
    });
    showToast(t.itemAddedToList(rawName));
  }, [showToast, t]);

  const handleRevertItemFromSettings = useCallback((itemName: string, wasExistingBeforeAdd: boolean) => {
    const rawName = itemName.trim();
    if (!rawName) return;
    const lowerName = rawName.toLowerCase();

    setItems(prev => {
      const existingIndex = prev.findIndex(i => i.name.toLowerCase() === lowerName);
      if (existingIndex < 0) return prev;

      const existing = prev[existingIndex];
      // If it existed before adding from history and quantity > 1, decrement quantity by 1
      if (wasExistingBeforeAdd && existing.quantity > 1) {
        const next = [...prev];
        next[existingIndex] = {
          ...existing,
          quantity: existing.quantity - 1,
          addedAt: Date.now()
        };
        return next;
      } else {
        // Otherwise remove the item completely from the list
        return prev.filter(i => i.id !== existing.id);
      }
    });

    setHistoryAddedMap(m => {
      const next = { ...m };
      delete next[lowerName];
      return next;
    });

    showToast(t.itemRemovedFromList ? t.itemRemovedFromList(rawName) : `${rawName} removido da lista`);
  }, [showToast, t]);

  const handleAddMultipleItemsFromSettings = useCallback((itemsData: { name: string; quantity?: number; unitPrice?: number }[]) => {
    if (!itemsData || itemsData.length === 0) return;
    setItems(prev => {
      let next = [...prev];
      itemsData.forEach(itemData => {
        const rawName = itemData.name.trim();
        if (!rawName) return;
        const qty = itemData.quantity && itemData.quantity > 0 ? itemData.quantity : 1;
        const price = itemData.unitPrice && itemData.unitPrice >= 0 ? itemData.unitPrice : 0;
        const existingIndex = next.findIndex(i => i.name.toLowerCase() === rawName.toLowerCase());
        if (existingIndex >= 0) {
          next[existingIndex] = {
            ...next[existingIndex],
            quantity: next[existingIndex].quantity + qty,
            unitPrice: price > 0 ? price : next[existingIndex].unitPrice,
            isAvailable: true,
            addedAt: Date.now()
          };
        } else {
          next.unshift({
            id: crypto.randomUUID(),
            name: rawName.charAt(0).toUpperCase() + rawName.slice(1),
            quantity: qty,
            unitPrice: price,
            isAvailable: true,
            isPurchased: false,
            addedAt: Date.now()
          });
        }
      });
      return next;
    });
    showToast(t.allItemsAddedToList(itemsData.length));
  }, [showToast, t]);

  const handleExport = useCallback((includePrice: boolean) => {
    const doc = new jsPDF();
    const currency = settings.currency;
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235); // Blue-600
    doc.text(t.pdfTitle, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`${t.pdfDate} ${new Date().toLocaleDateString(locale)}`, 14, 28);

    // Grouping
    const available = items.filter(i => i.isAvailable && !i.isPurchased);
    const purchased = items.filter(i => i.isAvailable && i.isPurchased);
    const unavailable = items.filter(i => !i.isAvailable);

    let currentY = 35;

    const addSection = (title: string, list: ShoppingItem[]) => {
      if (list.length === 0) return;

      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.setFont('helvetica', 'bold');
      doc.text(title, 14, currentY);
      currentY += 4;

      const columns = [t.pdfQty, t.pdfProduct];
      if (includePrice) {
        columns.push(t.pdfUnitPrice, t.pdfTotal);
      }

      const rows = list.map(i => {
        const row = [`${i.quantity} ${t.unitShort}`, i.name];
        if (includePrice) {
          row.push(
            `${currency} ${i.unitPrice.toLocaleString(locale, { minimumFractionDigits: 2 })}`,
            `${currency} ${(i.unitPrice * i.quantity).toLocaleString(locale, { minimumFractionDigits: 2 })}`
          );
        }
        return row;
      });

      autoTable(doc, {
        startY: currentY,
        head: [columns],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] }, // Blue-600
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          currentY = data.cursor ? data.cursor.y + 15 : currentY + 15;
        }
      });
      
      // Update currentY after table
      const finalY = (doc as any).lastAutoTable.finalY;
      currentY = finalY + 15;
    };

    addSection(t.pdfToBuy, available);
    addSection(t.pdfInCart, purchased);
    addSection(t.pdfUnavailable, unavailable);

    if (includePrice) {
      const total = items.filter(i => i.isAvailable).reduce((acc, curr) => acc + (curr.unitPrice * curr.quantity), 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${t.pdfEstimatedTotal} ${currency} ${total.toLocaleString(locale, { minimumFractionDigits: 2 })}`, 14, currentY);
    }

    doc.save(`SuperList_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportModal(false);
  }, [items, settings.currency, locale, t]);

  // Modo de exibição e ordenação (tanto na tela principal Minha Lista quanto no Modo Visualização)
  interface ViewCategoryGroup {
    category: CategoryDefinition;
    items: ShoppingItem[];
    subtotal: number;
  }

  // Função unificada de ordenação baseada na opção selecionada (viewSortOption)
  const getItemSortFn = (option: ViewSortOption) => (a: ShoppingItem, b: ShoppingItem) => {
    if (option === 'alphabetical') {
      return a.name.localeCompare(b.name);
    }
    if (option === 'value') {
      const valA = a.unitPrice * a.quantity;
      const valB = b.unitPrice * b.quantity;
      return valB - valA;
    }
    if (option === 'last_modified') {
      return b.addedAt - a.addedAt;
    }
    return a.name.localeCompare(b.name);
  };

  // Seções no modo padrão (divididas por Para Comprar, No Carrinho, Indisponíveis ou Categorias se viewSortOption === 'category')
  const defaultSections = useMemo<Record<string, ShoppingItem[]>>(() => {
    let baseFiltered = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtragem por status só é aplicada quando o modo Visualização estiver ativo
    if (isViewMode) {
      if (filterStatus === 'pending') baseFiltered = baseFiltered.filter(i => i.isAvailable && !i.isPurchased);
      if (filterStatus === 'purchased') baseFiltered = baseFiltered.filter(i => i.isAvailable && i.isPurchased);
      if (filterStatus === 'unavailable') baseFiltered = baseFiltered.filter(i => !i.isAvailable);
    }

    const sortFn = getItemSortFn(viewSortOption);

    const grouped = {
      available: baseFiltered.filter(i => i.isAvailable && !i.isPurchased).sort(sortFn),
      purchased: baseFiltered.filter(i => i.isAvailable && i.isPurchased).sort(sortFn),
      unavailable: baseFiltered.filter(i => !i.isAvailable).sort(sortFn)
    };

    return grouped;
  }, [items, searchTerm, viewSortOption, filterStatus, isViewMode]);

  const viewModeData = useMemo(() => {
    let baseFiltered = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterStatus === 'pending') baseFiltered = baseFiltered.filter(i => i.isAvailable && !i.isPurchased);
    if (filterStatus === 'purchased') baseFiltered = baseFiltered.filter(i => i.isAvailable && i.isPurchased);
    if (filterStatus === 'unavailable') baseFiltered = baseFiltered.filter(i => !i.isAvailable);

    if (viewSortOption === 'category') {
      // Agrupamento automático por categorias
      const groupsMap = new Map<string, { category: CategoryDefinition; items: ShoppingItem[] }>();

      baseFiltered.forEach(item => {
        const cat = detectCategory(item.name);
        if (!groupsMap.has(cat.id)) {
          groupsMap.set(cat.id, { category: cat, items: [] });
        }
        groupsMap.get(cat.id)!.items.push(item);
      });

      // Ordena os itens dentro de cada categoria por nome
      const categoryGroups: ViewCategoryGroup[] = [];
      groupsMap.forEach(group => {
        group.items.sort((a, b) => a.name.localeCompare(b.name));
        const subtotal = group.items.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
        categoryGroups.push({
          category: group.category,
          items: group.items,
          subtotal
        });
      });

      // Ordenar categorias colocando 'other' no final e o restante alfabeticamente
      categoryGroups.sort((a, b) => {
        if (a.category.id === 'other') return 1;
        if (b.category.id === 'other') return -1;
        const nameA = getCategoryDisplayName(a.category, currentLang);
        const nameB = getCategoryDisplayName(b.category, currentLang);
        return nameA.localeCompare(nameB);
      });

      return { isCategoryMode: true as const, categoryGroups };
    }

    // Ordenação tradicional da lista (Alfabético, Valor ou Última Modificação)
    const sorted = [...baseFiltered].sort(getItemSortFn(viewSortOption));

    return { isCategoryMode: false as const, items: sorted };
  }, [items, searchTerm, filterStatus, viewSortOption, currentLang]);

  interface CategorySummaryItem {
    category: CategoryDefinition;
    productCount: number;
    totalValue: number;
    items: ShoppingItem[];
  }

  const categorySummary = useMemo<CategorySummaryItem[]>(() => {
    let filtered = items;
    if (filterStatus === 'pending') {
      filtered = items.filter(i => i.isAvailable && !i.isPurchased);
    } else if (filterStatus === 'purchased') {
      filtered = items.filter(i => i.isAvailable && i.isPurchased);
    } else if (filterStatus === 'unavailable') {
      filtered = items.filter(i => !i.isAvailable);
    }

    const map = new Map<string, { category: CategoryDefinition; count: number; totalValue: number; items: ShoppingItem[] }>();

    filtered.forEach(item => {
      const cat = detectCategory(item.name);
      const val = (item.unitPrice || 0) * (item.quantity || 1);
      const existing = map.get(cat.id);
      if (existing) {
        existing.count += 1;
        existing.totalValue += val;
        existing.items.push(item);
      } else {
        map.set(cat.id, {
          category: cat,
          count: 1,
          totalValue: val,
          items: [item]
        });
      }
    });

    const result: CategorySummaryItem[] = Array.from(map.values()).map(entry => {
      // Ordena os itens daquela categoria alfabeticamente
      entry.items.sort((a, b) => a.name.localeCompare(b.name));
      return {
        category: entry.category,
        productCount: entry.count,
        totalValue: entry.totalValue,
        items: entry.items
      };
    });

    result.sort((a, b) => {
      if (b.totalValue !== a.totalValue) return b.totalValue - a.totalValue;
      if (a.category.id === 'other') return 1;
      if (b.category.id === 'other') return -1;
      const nameA = getCategoryDisplayName(a.category, currentLang);
      const nameB = getCategoryDisplayName(b.category, currentLang);
      return nameA.localeCompare(nameB);
    });

    return result;
  }, [items, filterStatus, currentLang]);

  const totalSummaryProducts = useMemo(() => {
    return categorySummary.reduce((sum, c) => sum + c.productCount, 0);
  }, [categorySummary]);

  const totalSummaryValue = useMemo(() => {
    return categorySummary.reduce((sum, c) => sum + c.totalValue, 0);
  }, [categorySummary]);

  const budgetExceeded = settings.isBudgetModeActive && totalValue > settings.budgetLimit;

  const clearList = (type: 'all' | 'purchased' | 'unavailable') => {
    if (type === 'all') setItems([]);
    else if (type === 'purchased') {
      const purchased = items.filter(i => i.isAvailable && i.isPurchased);
      if (purchased.length > 0) {
        const purchaseRecord: SavedList = {
          id: crypto.randomUUID(),
          date: Date.now(),
          totalItems: purchased.length,
          totalValue: purchased.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0),
          items: [...purchased]
        };
        setLists(prevLists => prevLists.map(list => {
          if (list.id === activeList.id) {
            return {
              ...list,
              savedHistory: [purchaseRecord, ...(list.savedHistory || [])],
              items: list.items.filter(i => !(i.isAvailable && i.isPurchased))
            };
          }
          return list;
        }));
      } else {
        setItems(prev => prev.filter(i => !(i.isAvailable && i.isPurchased)));
      }
    }
    else if (type === 'unavailable') setItems(prev => prev.filter(i => i.isAvailable));
    setShowClearConfirm(false);
  };

  const sortOptionsConfig = [
    { id: 'alphabetical' as ViewSortOption, label: t.sortAlphabetical, icon: ArrowUpDown },
    { id: 'value' as ViewSortOption, label: t.sortValue, icon: DollarSign },
    { id: 'category' as ViewSortOption, label: t.sortCategory, icon: Shapes },
    { id: 'last_modified' as ViewSortOption, label: t.sortLastModified, icon: Clock },
  ];

  return (
    <div 
      className={`min-h-screen flex flex-col pb-36 sm:pb-44 transition-colors relative ${settings.textSize === 'small' ? 'text-sm' : settings.textSize === 'large' ? 'text-lg' : 'text-base'}`}
      style={{
        backgroundColor: activeAppTheme.colors.background,
        color: activeAppTheme.colors.text
      }}
    >
      <div className="relative z-10 flex flex-col min-h-screen">
      <Header 
        itemCount={items.length} 
        availableCount={items.filter(i => i.isAvailable && !i.isPurchased).length}
        purchasedCount={items.filter(i => i.isAvailable && i.isPurchased).length}
        unavailableCount={items.filter(i => !i.isAvailable).length}
        onOpenSettings={() => setShowSettings(true)}
        onClearList={() => setShowClearConfirm(true)}
        isViewMode={isViewMode}
        onToggleViewMode={() => {
          setIsViewMode(prev => {
            if (prev) {
              setFilterStatus('all');
            }
            return !prev;
          });
        }}
        onExport={() => setShowExportModal(true)}
        currentFilter={filterStatus}
        onFilterChange={setFilterStatus}
        lang={currentLang}
        primaryColor={activeAppTheme.colors.primary}
        isDarkTheme={activeAppTheme.isDark}
        themeConfig={activeAppTheme}
        activeListName={activeList.name}
        activeListIcon={activeList.icon}
        onOpenListMenu={() => setShowListMenu(true)}
        userName={userName}
        onSignOut={signOut}
      />

      <main className="flex-1 px-4 py-2 space-y-3 max-w-lg mx-auto w-full">
        {!isViewMode && (
          <div className="mb-2">
            <div className="flex flex-col gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
                placeholder={t.productPlaceholder}
                style={{
                  backgroundColor: activeAppTheme.colors.inputBg,
                  color: activeAppTheme.colors.text
                }}
                className="w-full px-4 py-3 rounded-xl border-0 outline-none font-medium transition-all"
              />
              
              <div className="flex gap-2 w-full items-center">
                {/* Container Qtd e Preço com fundo um tom acima do fundo, sem borda e sem sombra */}
                <div 
                  style={{
                    backgroundColor: activeAppTheme.colors.inputBg
                  }}
                  className="flex flex-1 items-center rounded-xl overflow-hidden"
                >
                  <div className="flex items-center flex-1 px-3">
                    <span 
                      style={{ color: activeAppTheme.colors.textSecondary }}
                      className="text-[10px] font-bold mr-1 uppercase"
                    >
                      {t.qtyLabel}
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addItem()}
                      placeholder="1"
                      style={{ color: activeAppTheme.colors.text }}
                      className="w-full bg-transparent py-3 text-sm font-bold outline-none border-0"
                    />
                  </div>
                  <div 
                    style={{ backgroundColor: `${activeAppTheme.colors.textSecondary}25` }}
                    className="w-px h-5" 
                  />
                  <div className="flex items-center flex-[1.5] px-3">
                    <span 
                      style={{ color: activeAppTheme.colors.textSecondary }}
                      className="text-[10px] font-bold mr-0.5 uppercase"
                    >
                      {settings.currency}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value.replace(/[^0-9.,]/g, ''))}
                      onBlur={() => {
                        const price = parseFloat(newItemPrice.replace(',', '.'));
                        if (!isNaN(price) && price !== 0) {
                          setNewItemPrice(price.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                        }
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && addItem()}
                      placeholder={t.pricePlaceholder}
                      style={{ color: activeAppTheme.colors.text }}
                      className="w-full bg-transparent py-3 text-sm font-bold outline-none border-0"
                    />
                  </div>
                </div>

                {/* Botões de Status Rápido e Botão Principal de Adicionar */}
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={handlePurchasedButtonClick}
                    style={isNewItemPurchased ? {
                      backgroundColor: '#16a34a',
                      color: '#FFFFFF'
                    } : {
                      backgroundColor: activeAppTheme.colors.inputBg,
                      color: activeAppTheme.colors.textSecondary
                    }}
                    className="w-12 h-12 flex items-center justify-center rounded-xl border-0 transition-all active:scale-90"
                    aria-label={newItemName.trim() ? t.markExistingAsPurchased : t.addAsPurchased}
                    title={newItemName.trim() ? t.markExistingAsPurchased : t.addAsPurchased}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </button>
                  
                  {/* Botão principal de adicionar: cor primária sólida com ícone branco, sem sombra */}
                  <button 
                    onClick={addItem}
                    style={{ 
                      backgroundColor: activeAppTheme.colors.primary, 
                      color: '#FFFFFF'
                    }}
                    className="w-12 h-12 flex items-center justify-center rounded-xl border-0 shadow-none transition-all active:scale-90"
                    aria-label={t.addItem}
                    title={t.addItem}
                  >
                    <Plus className="w-6 h-6 text-white" strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
            {feedback && <p className="text-amber-500 text-[10px] mt-1 px-1 font-bold uppercase">{feedback}</p>}
          </div>
        )}

        {/* Resumo por Categorias (exibido no modo Resumo / Visualização) */}
        {isViewMode && (
          <div 
            style={{
              color: activeAppTheme.colors.text
            }}
            className="rounded-2xl p-2 transition-all animate-in fade-in slide-in-from-top-2 duration-300"
          >
            {/* Cabeçalho do Resumo por Categorias (com Total e Botão de Expandir/Recolher) */}
            <div 
              className={`flex items-center justify-between gap-2 transition-all ${
                isCategorySummaryOpen ? 'pb-2 mb-2' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => setIsCategorySummaryOpen(prev => !prev)}
                className="flex items-center gap-2 text-left group cursor-pointer select-none min-w-0"
                aria-expanded={isCategorySummaryOpen}
              >
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-active:scale-95"
                  style={{ backgroundColor: activeAppTheme.colors.inputBg, color: activeAppTheme.colors.primary }}
                >
                  <Shapes className="w-4 h-4" />
                </div>
                <h2 
                  style={{ color: activeAppTheme.colors.primary }}
                  className="text-xs font-bold uppercase tracking-wider truncate group-hover:opacity-90"
                >
                  {t.categorySummary}
                </h2>
                {categorySummary.length > 0 && (
                  <span 
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{ backgroundColor: activeAppTheme.colors.inputBg, color: activeAppTheme.colors.primary }}
                  >
                    {categorySummary.length}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2 shrink-0">
                {/* Total visível diretamente no cabeçalho quando recolhido */}
                {!isCategorySummaryOpen && categorySummary.length > 0 && (
                  <span 
                    className="text-xs font-extrabold font-mono tracking-tight px-2.5 py-1 rounded-lg"
                    style={{ 
                      backgroundColor: activeAppTheme.colors.inputBg,
                      color: activeAppTheme.colors.primary 
                    }}
                  >
                    {settings.currency} {totalSummaryValue.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setIsCategorySummaryOpen(prev => !prev)}
                  style={{ 
                    backgroundColor: activeAppTheme.colors.inputBg,
                    color: activeAppTheme.colors.primary
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 hover:opacity-80 shrink-0 border-0"
                  title={isCategorySummaryOpen ? t.collapseCategorySummary : t.expandCategorySummary}
                  aria-label={isCategorySummaryOpen ? t.collapseCategorySummary : t.expandCategorySummary}
                >
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                      isCategorySummaryOpen ? 'rotate-180' : 'rotate-0'
                    }`} 
                    strokeWidth={2.5} 
                  />
                </button>
              </div>
            </div>

            {/* Conteúdo com Transição Suave (recolhido por padrão) */}
            <div 
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                isCategorySummaryOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
            >
              <div className="overflow-hidden">
                {categorySummary.length > 0 ? (
                  <div className="divide-y divide-gray-100/70 dark:divide-slate-700/40">
                    {categorySummary.map((item) => {
                      const catName = getCategoryDisplayName(item.category, currentLang);
                      const percentage = totalSummaryValue > 0 ? (item.totalValue / totalSummaryValue) * 100 : 0;
                      const isCatExpanded = !!expandedCategoryIds[item.category.id];

                      return (
                        <div 
                          key={item.category.id}
                          className="py-2.5 first:pt-1 last:pb-1 flex flex-col gap-1 transition-colors"
                        >
                          <div 
                            onClick={() => toggleCategoryExpansion(item.category.id)}
                            className="flex items-center justify-between gap-2 cursor-pointer select-none group"
                            role="button"
                            tabIndex={0}
                            aria-expanded={isCatExpanded}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleCategoryExpansion(item.category.id);
                              }
                            }}
                          >
                            {/* Categoria · Quantidade */}
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base shrink-0 leading-none transition-transform group-active:scale-95" role="img" aria-hidden="true">
                                {item.category.icon}
                              </span>
                              <span 
                                style={{ color: activeAppTheme.colors.text }}
                                className="text-xs font-bold truncate group-hover:opacity-90"
                              >
                                {catName}
                              </span>
                              <span className="text-gray-300 dark:text-slate-600 text-xs select-none">·</span>
                              <span 
                                style={{ color: activeAppTheme.colors.textSecondary }}
                                className="text-xs font-semibold shrink-0"
                              >
                                {t.productsLabel(item.productCount)}
                              </span>
                            </div>

                            {/* Valor total gasto alinhado à direita + Seta de expansão da categoria */}
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <span className="text-gray-300 dark:text-slate-600 text-xs select-none">·</span>
                              <span 
                                style={{ color: activeAppTheme.colors.text }}
                                className="text-xs font-bold font-mono tracking-tight"
                              >
                                {settings.currency} {item.totalValue.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>

                              {/* Seta de expansão que gira ao expandir/recolher */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCategoryExpansion(item.category.id);
                                }}
                                style={{
                                  color: activeAppTheme.colors.primary,
                                  backgroundColor: activeAppTheme.colors.inputBg
                                }}
                                className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 ml-0.5 hover:opacity-80 active:scale-90 shrink-0 border-0"
                                title={isCatExpanded ? t.collapseCategory : t.expandCategory}
                                aria-label={isCatExpanded ? t.collapseCategory : t.expandCategory}
                                aria-expanded={isCatExpanded}
                              >
                                <ChevronDown 
                                  className={`w-3.5 h-3.5 transition-transform duration-300 ease-in-out ${
                                    isCatExpanded ? 'rotate-180' : 'rotate-0'
                                  }`}
                                  strokeWidth={2.5}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Barra de proporção discreta */}
                          {totalSummaryValue > 0 && percentage > 0 && (
                            <div 
                              style={{ backgroundColor: `${activeAppTheme.colors.textSecondary}15` }}
                              className="w-full h-1 rounded-full overflow-hidden"
                            >
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${Math.max(percentage, 2)}%`,
                                  backgroundColor: activeAppTheme.colors.primary,
                                  opacity: 0.85
                                }}
                              />
                            </div>
                          )}

                          {/* Lista dos itens daquela categoria (nome, quantidade e valor) com transição suave e independente */}
                          <div 
                            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                              isCatExpanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div 
                                className="rounded-xl p-2 space-y-1.5"
                                style={{
                                  backgroundColor: activeAppTheme.colors.inputBg
                                }}
                              >
                                {item.items.map(catItem => {
                                  const itemSubtotal = (catItem.unitPrice || 0) * (catItem.quantity || 1);
                                  return (
                                    <div 
                                      key={catItem.id} 
                                      className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg transition-colors"
                                      style={{
                                        backgroundColor: activeAppTheme.colors.card
                                      }}
                                    >
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span 
                                          className="w-1.5 h-1.5 rounded-full shrink-0" 
                                          style={{ backgroundColor: activeAppTheme.colors.primary }} 
                                        />
                                        <span 
                                          style={{ color: activeAppTheme.colors.text }} 
                                          className={`text-xs font-bold truncate ${!catItem.isAvailable ? 'line-through opacity-60' : ''}`}
                                        >
                                          {catItem.name}
                                        </span>
                                        <span 
                                          style={{ color: activeAppTheme.colors.textSecondary }}
                                          className="text-[10px] font-semibold shrink-0"
                                        >
                                          {catItem.quantity} {t.unitShort}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0 text-right">
                                        <span 
                                          style={{ color: activeAppTheme.colors.text }}
                                          className="font-mono font-bold text-xs text-right"
                                        >
                                          {settings.currency} {itemSubtotal.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Linha de Totalização elegante e compacta no final da lista */}
                    <div 
                      className="pt-2 mt-1 flex items-center justify-between text-xs font-bold"
                    >
                      <div className="flex items-center gap-2">
                        <span 
                          style={{ color: activeAppTheme.colors.sectionTitle }}
                          className="uppercase text-[10px] tracking-wider font-extrabold"
                        >
                          {t.totalLabel}
                        </span>
                        <span className="text-gray-300 dark:text-slate-600 text-xs select-none">·</span>
                        <span 
                          style={{ color: activeAppTheme.colors.textSecondary }}
                          className="text-xs font-medium"
                        >
                          {t.productsLabel(totalSummaryProducts)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2 text-right">
                        <span className="text-gray-300 dark:text-slate-600 text-xs select-none">·</span>
                        <span 
                          className="text-xs font-extrabold font-mono tracking-tight text-right"
                          style={{ color: activeAppTheme.colors.primary }}
                        >
                          {settings.currency} {totalSummaryValue.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p 
                      style={{ color: activeAppTheme.colors.textSecondary }}
                      className="text-xs"
                    >
                      {t.noSummaryItems}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Barra de Busca com Filtro de Ordenação (no modo Visualização) */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input 
                type="text" 
                value={searchTerm} 
                onChange={(e) => handleSearchChange(e.target.value)} 
                placeholder={t.searchPlaceholder} 
                style={{
                  backgroundColor: activeAppTheme.colors.inputBg,
                  color: activeAppTheme.colors.text
                }}
                className="w-full rounded-xl py-2 pl-10 pr-4 text-xs border-0 outline-none transition-all"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Ícone de filtro/ordenação: cantos arredondados, sem borda e sem sombra */}
            <div className="relative shrink-0" ref={sortMenuRef}>
              <button
                type="button"
                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                style={isSortMenuOpen ? { 
                  backgroundColor: activeAppTheme.colors.primary, 
                  color: '#FFFFFF'
                } : {
                  backgroundColor: activeAppTheme.colors.inputBg,
                  color: activeAppTheme.colors.text
                }}
                className="h-9 px-2.5 rounded-xl border-0 shadow-none flex items-center gap-1.5 transition-all active:scale-95 text-xs font-bold"
                aria-label={t.sortButtonTitle}
                title={t.sortButtonTitle}
              >
                <SlidersHorizontal className="w-4 h-4" strokeWidth={2.5} />
                <span className="hidden sm:inline text-[11px] font-bold">
                  {sortOptionsConfig.find(o => o.id === viewSortOption)?.label}
                </span>
              </button>

                {/* Dropdown Menu compacto sem bordas */}
                {isSortMenuOpen && (
                  <div 
                    style={{
                      backgroundColor: activeAppTheme.colors.inputBg,
                      color: activeAppTheme.colors.text
                    }}
                    className="absolute right-0 top-full mt-1.5 w-52 rounded-2xl shadow-xl py-1.5 z-40 border-0 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div 
                      className="px-3 py-1.5 flex items-center justify-between"
                    >
                      <span 
                        style={{ color: activeAppTheme.colors.sectionTitle }}
                        className="text-[10px] font-bold uppercase tracking-wider"
                      >
                        {t.sortByLabel}
                      </span>
                    </div>

                    <div className="p-1 space-y-0.5">
                      {sortOptionsConfig.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = viewSortOption === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setViewSortOption(opt.id);
                              setIsSortMenuOpen(false);
                            }}
                            style={isSelected ? { 
                              backgroundColor: activeAppTheme.colors.primary, 
                              color: '#FFFFFF' 
                            } : {
                              color: activeAppTheme.colors.text
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors ${
                              isSelected ? 'font-black' : 'hover:opacity-80'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <Icon 
                                className="w-3.5 h-3.5 shrink-0"
                                style={isSelected ? { color: '#FFFFFF' } : undefined}
                              />
                              <span className="truncate">{opt.label}</span>
                            </div>
                            {isSelected && (
                              <Check 
                                className="w-3.5 h-3.5 shrink-0 ml-1.5 text-white" 
                                strokeWidth={3} 
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
          </div>

          {/* Lista de Itens: sem cartões brancos, sem bordas, sem sombras, direto sobre o fundo do tema */}
          <div 
            style={{
              color: activeAppTheme.colors.text
            }}
            className="space-y-4 min-h-[100px] transition-colors"
          >
          {filterStatus !== 'all' && (
            <div 
              className="px-2 pb-2 flex justify-between items-center animate-in fade-in slide-in-from-top-1 mb-2"
            >
              <span 
                style={{ color: activeAppTheme.colors.primary }}
                className="text-[10px] font-bold uppercase tracking-wider"
              >
                {t.filteringBy} {filterStatus === 'pending' ? t.filterAvailable : filterStatus === 'purchased' ? t.filterPurchased : t.filterUnavailable}
              </span>
              <button 
                onClick={() => setFilterStatus('all')} 
                style={{ color: activeAppTheme.colors.primary }}
                className="text-[10px] font-bold uppercase tracking-wider"
              >
                {t.clearFilter}
              </button>
            </div>
          )}

          {/* Renderização da Lista (tanto no Modo Visualização quanto na tela principal da Minha Lista) */}
          {viewSortOption === 'category' ? (
            // Agrupado por Categoria (disponível tanto no Modo Visualização quanto na Minha Lista)
            <>
              {viewModeData.categoryGroups.map((group) => (
                <div key={group.category.id} className="mb-3.5 last:mb-0">
                  <div className="flex items-center justify-between px-1 pb-1.5 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base shrink-0 leading-none" role="img" aria-hidden="true">
                        {group.category.icon}
                      </span>
                      {/* Títulos de seção em maiúsculas, na cor sóbria do tema */}
                      <span 
                        style={{ color: activeAppTheme.colors.sectionTitle }}
                        className="text-[11px] font-extrabold uppercase tracking-wider truncate"
                      >
                        {getCategoryDisplayName(group.category, currentLang)}
                      </span>
                      <span 
                        style={{ backgroundColor: activeAppTheme.colors.inputBg, color: activeAppTheme.colors.textSecondary }}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                      >
                        {group.items.length}
                      </span>
                    </div>
                    {/* Preço e subtotal alinhados à direita */}
                    <span 
                      style={{ color: activeAppTheme.colors.textSecondary }}
                      className="text-[10px] font-bold shrink-0 text-right"
                    >
                      {settings.currency}{group.subtotal.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {group.items.map(item => (
                    <ItemCard 
                      key={item.id} 
                      item={item} 
                      onUpdate={(u) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, addedAt: Date.now(), ...u } : i))} 
                      onDelete={() => handleDeleteItem(item)} 
                      textSizeClass="" 
                      titleSizeClass="" 
                      settings={settings} 
                      isViewMode={isViewMode}
                      onEditingChange={handleItemEditingChange}
                    />
                  ))}
                </div>
              ))}
              {viewModeData.categoryGroups.length === 0 && (
                <div className="py-12 text-center">
                  <p 
                    style={{ color: activeAppTheme.colors.textSecondary }}
                    className="text-sm font-medium"
                  >
                    {t.noItemsFound}
                  </p>
                </div>
              )}
            </>
          ) : isViewMode ? (
            // Modo Visualização com ordenação simples em lista contínua (Alfabético, Valor ou Última Modificação)
            <>
              {viewModeData.items.map(item => (
                <ItemCard 
                  key={item.id} 
                  item={item} 
                  onUpdate={(u) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, addedAt: Date.now(), ...u } : i))} 
                  onDelete={() => handleDeleteItem(item)} 
                  textSizeClass="" 
                  titleSizeClass="" 
                  settings={settings} 
                  isViewMode={isViewMode}
                  onEditingChange={handleItemEditingChange}
                />
              ))}
              {viewModeData.items.length === 0 && (
                <div className="py-12 text-center">
                  <p 
                    style={{ color: activeAppTheme.colors.textSecondary }}
                    className="text-sm font-medium"
                  >
                    {t.noItemsFound}
                  </p>
                </div>
              )}
            </>
          ) : (
            // Modo de Edição normal na Minha Lista (seções Para Comprar, No Carrinho, Indisponíveis ordenadas pela opção selecionada)
            <>
              {(Object.entries(defaultSections) as [string, ShoppingItem[]][]).map(([key, list]) => list && list.length > 0 && (
                <div key={key} className="mb-3.5 last:mb-0">
                  {/* Títulos de seção em maiúsculas, na cor primária, com espaçamento entre letras */}
                  <div className="flex items-center gap-2 px-1 pb-1.5">
                    <span 
                      style={{ color: activeAppTheme.colors.primary }}
                      className="text-[11px] font-extrabold uppercase tracking-wider"
                    >
                      {key === 'available' ? t.toBuy : key === 'purchased' ? t.inCart : t.unavailable}
                    </span>
                  </div>
                  {list.map(item => (
                    <ItemCard 
                      key={item.id} 
                      item={item} 
                      onUpdate={(u) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, addedAt: Date.now(), ...u } : i))} 
                      onDelete={() => handleDeleteItem(item)} 
                      textSizeClass="" 
                      titleSizeClass="" 
                      settings={settings} 
                      isViewMode={isViewMode}
                      onEditingChange={handleItemEditingChange}
                    />
                  ))}
                </div>
              ))}
              {(Object.values(defaultSections) as ShoppingItem[][]).every(l => l.length === 0) && (
                <div className="py-12 text-center">
                  <p 
                    style={{ color: activeAppTheme.colors.textSecondary }}
                    className="text-sm font-medium"
                  >
                    {t.noItemsFound}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Dynamic temporary spacer for keyboard avoidance */}
      <div 
        id="keyboard-avoidance-spacer"
        style={{ height: keyboardSpacerHeight }} 
        className="pointer-events-none w-full shrink-0"
        aria-hidden="true" 
      />
    </main>

      {/* Toast / Snackbar de Desfazer Exclusão (3 segundos) */}
      {deletedItemInfo && (
        <div className={`fixed ${isKeyboardActive ? 'bottom-4' : 'bottom-24'} left-4 right-4 max-w-sm mx-auto z-50 animate-in slide-in-from-bottom-4 fade-in duration-200`}>
          <div className="bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-gray-800 relative overflow-hidden">
            {/* Barra de contagem regressiva animada de 3 segundos */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 pointer-events-none">
              <div className="h-full bg-blue-500 animate-undo-progress" />
            </div>

            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-200 truncate">
                {t.itemDeleted(deletedItemInfo.item.name)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleUndoDelete}
              style={{ backgroundColor: activeAppTheme.colors.primary, color: '#FFFFFF' }}
              className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-none flex items-center gap-1 border-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a5 5 0 015 5v2m0 0l-4-4m4 4l4-4" />
              </svg>
              {t.undo}
            </button>
          </div>
        </div>
      )}

      {/* Toast / Snackbar de Confirmação Geral */}
      {toastMessage && (
        <div className={`fixed ${isKeyboardActive ? 'bottom-4' : 'bottom-24'} left-4 right-4 max-w-sm mx-auto z-50 animate-in slide-in-from-bottom-4 fade-in duration-200 pointer-events-none`}>
          <div className="bg-gray-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-center gap-2.5 border-0">
            <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5" strokeWidth={3} />
            </div>
            <span className="text-xs font-bold text-gray-100 text-center">
              {toastMessage}
            </span>
          </div>
        </div>
      )}

      {/* Rodapé "Total estimado" sem fundo branco, fixo, com o valor em destaque (28px, peso 800) */}
      <footer 
        className="fixed bottom-0 left-0 right-0 z-30 max-w-lg mx-auto px-4 pb-3 sm:pb-4 pt-1 pointer-events-none bg-transparent"
      >
        <div 
          style={{
            backgroundColor: activeAppTheme.colors.totalCardBg,
            color: activeAppTheme.colors.totalCardText
          }}
          className="relative pointer-events-auto rounded-[1.75rem] sm:rounded-[2rem] p-4 sm:p-5 transition-all duration-300 border-0 shadow-none"
        >
          {/* Barra de progresso / indicador de salvamento ocupando a largura total, fina e fixa na borda superior do card */}
          {editingItemState.active && (
            <div 
              className="absolute -top-[1.5px] left-4 right-4 h-[3px] rounded-full overflow-hidden pointer-events-none z-40 transition-opacity duration-200"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)'
              }}
            >
              {editingItemState.mode === 'hold' ? (
                <div 
                  style={{ backgroundColor: activeAppTheme.colors.totalCardProgressBar }}
                  className="h-full w-full rounded-full animate-long-press"
                />
              ) : (
                <div 
                  style={{ backgroundColor: activeAppTheme.colors.totalCardProgressBar }}
                  className="h-full w-full rounded-full animate-pulse shadow-none"
                />
              )}
            </div>
          )}

          {/* Linha Superior: "X de Y itens" à esquerda | Valor estimado em destaque (28px, peso 800) à direita */}
          <div className="flex items-center justify-between gap-3 mb-2.5">
            {/* Esquerda: "X de Y itens" */}
            <div className="flex flex-col min-w-0">
              <span 
                style={{ color: activeAppTheme.colors.totalCardText }}
                className="text-xs sm:text-sm font-semibold tracking-tight truncate"
              >
                {t.itemsCountRatio(purchasedItemsCount, totalAvailableItemsCount)}
              </span>

              {/* Indicador de Orçamento quando ativo */}
              {settings.isBudgetModeActive && (
                <span 
                  style={{ color: budgetExceeded ? '#FCA5A5' : activeAppTheme.colors.totalCardSubtext }}
                  className="text-[10px] font-medium tracking-tight mt-0.5 truncate flex items-center gap-1"
                >
                  {budgetExceeded ? (
                    <span className="font-bold flex items-center gap-1">
                      ⚠️ {t.overLimit} {settings.currency}{(totalValue - settings.budgetLimit).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <span>
                      {t.budgetLimit}: {settings.currency}{settings.budgetLimit.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </span>
              )}
            </div>

            {/* Direita: Valor estimado em destaque (28px, peso 800) e alinhado à direita */}
            <div className="flex items-baseline gap-1.5 shrink-0 text-right">
              <span 
                style={{ color: activeAppTheme.colors.totalCardText }}
                className="text-[28px] font-[800] tabular-nums tracking-normal leading-none text-right"
              >
                {settings.currency}{totalValue.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span 
                style={{ color: activeAppTheme.colors.totalCardSubtext }}
                className="text-xs sm:text-xs font-normal opacity-90 lowercase"
              >
                {t.estimatedSuffix}
              </span>
            </div>
          </div>

          {/* Barra de progresso fina e arredondada (trilho translúcido + preenchimento em cor de destaque) */}
          <div 
            style={{ backgroundColor: activeAppTheme.colors.totalCardProgressTrack }}
            className="w-full h-2 rounded-full overflow-hidden"
          >
            <div 
              style={{ 
                width: `${purchaseProgressPercentage}%`,
                backgroundColor: activeAppTheme.colors.totalCardProgressBar 
              }}
              className="h-full rounded-full transition-all duration-500 ease-out shadow-none"
            />
          </div>
        </div>
      </footer>

      {showScrollTop && !isKeyboardActive && (
        <button
          onClick={scrollToTop}
          style={{ 
            backgroundColor: activeAppTheme.colors.inputBg, 
            color: activeAppTheme.colors.primary 
          }}
          className="fixed bottom-32 sm:bottom-36 right-6 z-40 p-2.5 rounded-full border-0 transition-all animate-in fade-in zoom-in duration-300 active:scale-90"
          aria-label={t.backToTop}
          title={t.backToTop}
        >
          <ChevronUp size={20} strokeWidth={3} />
        </button>
      )}

      {showListMenu && (
        <ListMenuModal 
          lists={lists}
          activeListId={activeList.id}
          onSelectList={handleSelectList}
          onCreateList={handleCreateList}
          onRenameList={handleRenameList}
          onDeleteList={handleDeleteList}
          onClose={() => setShowListMenu(false)}
          themeConfig={activeAppTheme}
          lang={currentLang}
        />
      )}

      {showSettings && (
        <SettingsModal 
          settings={settings} 
          onUpdate={setSettings} 
          onClose={() => setShowSettings(false)} 
          onAddItemToList={handleAddItemFromSettings}
          onAddMultipleItemsToList={handleAddMultipleItemsFromSettings}
          onRevertItemFromList={handleRevertItemFromSettings}
          historyAddedMap={historyAddedMap}
          currentItems={items}
          activeListName={activeList.name}
          activeListHistory={activeList.savedHistory || []}
          onUpdateActiveListHistory={handleUpdateActiveListHistory}
          allListsHistory={lists.flatMap(l => l.savedHistory || [])}
          allListsItems={lists.flatMap(l => l.items || [])}
          userName={userName}
          userEmail={userEmail}
          onSignOut={signOut}
        />
      )}
      {showExportModal && (
        <ExportModal 
          onConfirm={handleExport} 
          onSaveHistory={saveToHistory}
          onClose={() => setShowExportModal(false)} 
          lang={currentLang}
          themeConfig={activeAppTheme}
        />
      )}


      
      {showClearConfirm && (
        <div 
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center animate-in fade-in touch-none select-none overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" 
            onClick={() => setShowClearConfirm(false)} 
          />
          <div 
            style={{
              backgroundColor: activeAppTheme.colors.card,
              color: activeAppTheme.colors.text
            }}
            className="relative w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 border-0 z-10 touch-auto select-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-300/40 rounded-full mx-auto mb-6 sm:hidden" onClick={() => setShowClearConfirm(false)} />
            <h2 
              style={{ color: activeAppTheme.colors.primary }}
              className="text-base font-bold uppercase tracking-wider mb-6 text-center"
            >
              {t.clearListTitle}
            </h2>
            <div className="space-y-3">
              <button 
                onClick={() => clearList('purchased')} 
                style={{
                  backgroundColor: activeAppTheme.colors.inputBg,
                  color: activeAppTheme.colors.text
                }}
                className="w-full py-3.5 font-bold rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2 border-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t.removePurchased}
              </button>
              <button 
                onClick={() => clearList('unavailable')} 
                style={{
                  backgroundColor: activeAppTheme.colors.inputBg,
                  color: activeAppTheme.colors.text
                }}
                className="w-full py-3.5 font-bold rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2 border-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                {t.removeUnavailable}
              </button>
              <button 
                onClick={() => clearList('all')} 
                style={{
                  backgroundColor: activeAppTheme.colors.deleteBg,
                  color: activeAppTheme.colors.deleteText
                }}
                className="w-full py-3.5 font-bold rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2 border-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t.removeAll}
              </button>
              <button 
                onClick={() => setShowClearConfirm(false)} 
                style={{ color: activeAppTheme.colors.textSecondary }}
                className="w-full py-3 font-bold text-xs"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default App;
