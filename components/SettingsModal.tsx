import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppSettings, SavedList, SwipeAction, FavoriteProduct, ShoppingItem } from '../types';
import { X, Check, Plus, Trash2, Trophy, Star, Palette, ChevronRight } from 'lucide-react';
import { getTranslation } from '../i18n';
import { APP_THEMES, AppThemeId, DEFAULT_APP_THEME } from '../utils/appThemes';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdate: (s: AppSettings) => void;
  onClose: () => void;
  onAddItemToList?: (item: { name: string; quantity?: number; unitPrice?: number }) => void;
  onAddMultipleItemsToList?: (items: { name: string; quantity?: number; unitPrice?: number }[]) => void;
  currentItems?: ShoppingItem[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  settings, 
  onUpdate, 
  onClose,
  onAddItemToList,
  onAddMultipleItemsToList,
  currentItems
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>({
    ...settings,
    language: settings.language || 'pt',
  });

  const currentLang = localSettings.language || 'pt';
  const t = getTranslation(currentLang);
  const locale = currentLang === 'en' ? 'en-US' : 'pt-BR';

  const activeThemeId: AppThemeId = useMemo(() => {
    if (typeof localSettings.theme === 'string' && localSettings.theme in APP_THEMES) {
      return localSettings.theme as AppThemeId;
    }
    return DEFAULT_APP_THEME;
  }, [localSettings.theme]);

  const currentAppTheme = APP_THEMES[activeThemeId] || APP_THEMES[DEFAULT_APP_THEME];

  const [displayBudget, setDisplayBudget] = useState(
    settings.budgetLimit === 0 ? '' : settings.budgetLimit.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
  const [viewingHistory, setViewingHistory] = useState<SavedList | null>(null);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showMostPurchasedModal, setShowMostPurchasedModal] = useState(false);
  const [historyToast, setHistoryToast] = useState<string | null>(null);
  const historyToastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Estados para Favoritos e Rankings
  const [newFavName, setNewFavName] = useState('');
  const [newFavQty, setNewFavQty] = useState('1');
  const [rankingTab, setRankingTab] = useState<'5' | '10'>('5');
  const [addedItemKey, setAddedItemKey] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (historyToastTimerRef.current) {
        clearTimeout(historyToastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const formatted = localSettings.budgetLimit === 0 ? '' : localSettings.budgetLimit.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const currentNumeric = parseFloat(displayBudget.replace(',', '.'));
    const isSameValue = isNaN(currentNumeric) ? localSettings.budgetLimit === 0 : currentNumeric === localSettings.budgetLimit;
    
    if (!isSameValue) {
      setDisplayBudget(formatted);
    }
  }, [localSettings.budgetLimit, locale]);

  useEffect(() => {
    setLocalSettings({
      ...settings,
      language: settings.language || 'pt',
    });
  }, [settings]);

  const currencies = ['€', '$', 'R$', '£'];

  const handleBudgetChange = (val: string) => {
    const cleanVal = val.replace(/[^0-9.,]/g, '');
    const parts = cleanVal.split(/[.,]/);
    if (parts.length > 2) return;

    setDisplayBudget(cleanVal);
    const normalized = cleanVal.replace(',', '.');
    const budget = parseFloat(normalized);
    setLocalSettings(prev => ({ ...prev, budgetLimit: isNaN(budget) ? 0 : budget }));
  };

  const handleDeleteHistory = (id: string) => {
    const newHistory = (localSettings.savedHistory || []).filter(h => h.id !== id);
    const updated: AppSettings = { ...localSettings, savedHistory: newHistory };
    setLocalSettings(updated);
    onUpdate(updated);

    if (historyToastTimerRef.current) {
      clearTimeout(historyToastTimerRef.current);
    }
    setHistoryToast(t.historyDeletedToast);
    historyToastTimerRef.current = setTimeout(() => {
      setHistoryToast(null);
    }, 2500);
  };

  const handleConfirm = () => {
    onUpdate(localSettings);
    onClose();
  };

  // Funções de Favoritos
  const handleAddFavorite = (nameOverride?: string) => {
    const rawName = (nameOverride || newFavName).trim();
    if (!rawName) return;

    const qty = parseInt(newFavQty, 10);
    const validQty = !isNaN(qty) && qty > 0 ? qty : 1;

    // Verificar duplicidade em favoritos
    const existing = (localSettings.favorites || []).find(
      f => f.name.toLowerCase() === rawName.toLowerCase()
    );
    if (existing) {
      if (historyToastTimerRef.current) clearTimeout(historyToastTimerRef.current);
      setHistoryToast(`"${rawName}" já está nos favoritos`);
      historyToastTimerRef.current = setTimeout(() => setHistoryToast(null), 2000);
      return;
    }

    const newFav: FavoriteProduct = {
      id: crypto.randomUUID(),
      name: rawName.charAt(0).toUpperCase() + rawName.slice(1),
      defaultQuantity: validQty
    };

    const updatedFavorites = [...(localSettings.favorites || []), newFav];
    const updated: AppSettings = { ...localSettings, favorites: updatedFavorites };
    setLocalSettings(updated);
    onUpdate(updated);

    setNewFavName('');
    setNewFavQty('1');

    if (historyToastTimerRef.current) clearTimeout(historyToastTimerRef.current);
    setHistoryToast(t.itemAddedToList(newFav.name));
    historyToastTimerRef.current = setTimeout(() => setHistoryToast(null), 2000);
  };

  const handleDeleteFavorite = (id: string) => {
    const updatedFavorites = (localSettings.favorites || []).filter(f => f.id !== id);
    const updated: AppSettings = { ...localSettings, favorites: updatedFavorites };
    setLocalSettings(updated);
    onUpdate(updated);

    if (historyToastTimerRef.current) clearTimeout(historyToastTimerRef.current);
    setHistoryToast(t.favoriteDeletedToast);
    historyToastTimerRef.current = setTimeout(() => setHistoryToast(null), 2000);
  };

  const handleAddItemToShoppingList = (item: { name: string; quantity?: number; unitPrice?: number; id?: string }) => {
    if (onAddItemToList) {
      onAddItemToList({
        name: item.name,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0
      });
    }

    const key = item.id || item.name;
    setAddedItemKey(key);
    setTimeout(() => {
      setAddedItemKey(prev => (prev === key ? null : prev));
    }, 1500);

    if (historyToastTimerRef.current) clearTimeout(historyToastTimerRef.current);
    setHistoryToast(t.itemAddedToList(item.name));
    historyToastTimerRef.current = setTimeout(() => setHistoryToast(null), 2000);
  };

  const handleAddAllFavorites = () => {
    const favs = localSettings.favorites || [];
    if (favs.length === 0 || !onAddMultipleItemsToList) return;

    onAddMultipleItemsToList(
      favs.map(f => ({
        name: f.name,
        quantity: f.defaultQuantity || 1,
        unitPrice: f.defaultUnitPrice || 0
      }))
    );

    if (historyToastTimerRef.current) clearTimeout(historyToastTimerRef.current);
    setHistoryToast(t.allItemsAddedToList(favs.length));
    historyToastTimerRef.current = setTimeout(() => setHistoryToast(null), 2500);
  };

  const handleAddAllFromHistory = (history: SavedList) => {
    if (!history.items?.length || !onAddMultipleItemsToList) return;
    onAddMultipleItemsToList(
      history.items.map(i => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice
      }))
    );

    if (historyToastTimerRef.current) clearTimeout(historyToastTimerRef.current);
    setHistoryToast(t.allItemsAddedToList(history.items.length));
    historyToastTimerRef.current = setTimeout(() => setHistoryToast(null), 2500);
  };

  // Cálculo dos Mais Comprados gerado automaticamente apenas a partir dos itens marcados como "comprado"
  const mostPurchasedItems = useMemo(() => {
    const history = localSettings.savedHistory || [];
    const map = new Map<string, { name: string; purchaseCount: number; totalQuantity: number; lastUnitPrice: number }>();

    // 1. Contagem dos itens marcados como comprado no histórico salvo ao longo do tempo
    history.forEach(list => {
      (list.items || []).forEach(item => {
        if (item.isPurchased) {
          const key = item.name.trim().toLowerCase();
          if (!key) return;
          const entry = map.get(key);
          if (entry) {
            entry.purchaseCount += 1;
            entry.totalQuantity += (item.quantity || 1);
            if (item.unitPrice && item.unitPrice > 0) {
              entry.lastUnitPrice = item.unitPrice;
            }
          } else {
            map.set(key, {
              name: item.name,
              purchaseCount: 1,
              totalQuantity: item.quantity || 1,
              lastUnitPrice: item.unitPrice || 0
            });
          }
        }
      });
    });

    // 2. Contagem dos itens marcados como comprado na lista atual
    if (currentItems && currentItems.length > 0) {
      currentItems.forEach(item => {
        if (item.isPurchased && item.isAvailable) {
          const key = item.name.trim().toLowerCase();
          if (!key) return;
          const entry = map.get(key);
          if (entry) {
            entry.purchaseCount += 1;
            entry.totalQuantity += (item.quantity || 1);
            if (item.unitPrice && item.unitPrice > 0) {
              entry.lastUnitPrice = item.unitPrice;
            }
          } else {
            map.set(key, {
              name: item.name,
              purchaseCount: 1,
              totalQuantity: item.quantity || 1,
              lastUnitPrice: item.unitPrice || 0
            });
          }
        }
      });
    }

    const list = Array.from(map.values());
    list.sort((a, b) => {
      if (b.purchaseCount !== a.purchaseCount) {
        return b.purchaseCount - a.purchaseCount;
      }
      return b.totalQuantity - a.totalQuantity;
    });

    return list;
  }, [localSettings.savedHistory, currentItems]);

  const topItems = useMemo(() => {
    const limit = rankingTab === '5' ? 5 : 10;
    return mostPurchasedItems.slice(0, limit);
  }, [mostPurchasedItems, rankingTab]);

  const swipeOptions: { val: SwipeAction; label: string }[] = [
    { val: 'purchase', label: t.swipeOptPurchase },
    { val: 'unavailable', label: t.swipeOptUnavailable },
    { val: 'delete', label: t.swipeOptDelete },
    { val: 'none', label: t.swipeOptNone }
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        style={{
          backgroundColor: currentAppTheme.colors.card,
          color: currentAppTheme.colors.text
        }}
        className="relative w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 animate-in slide-in-from-bottom duration-300 border-0 shadow-none"
      >
        <div className="w-12 h-1.5 rounded-full mx-auto mb-6 sm:hidden cursor-pointer opacity-30" style={{ backgroundColor: currentAppTheme.colors.textSecondary }} onClick={onClose} />
        
        {viewingHistory ? (
          <div className="flex flex-col h-full max-h-[80vh]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  onClick={() => setViewingHistory(null)}
                  style={{
                    backgroundColor: currentAppTheme.colors.inputBg,
                    color: currentAppTheme.colors.textSecondary
                  }}
                  className="p-2 rounded-xl active:scale-90 transition-transform shrink-0 border-0"
                  aria-label={t.backToSettings}
                  title={t.back}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="min-w-0">
                  <h2 style={{ color: currentAppTheme.colors.text }} className="text-lg font-bold leading-tight truncate">
                    {new Date(viewingHistory.date).toLocaleDateString(locale, { month: 'long', year: 'numeric' }).charAt(0).toUpperCase() + new Date(viewingHistory.date).toLocaleDateString(locale, { month: 'long', year: 'numeric' }).slice(1)}
                  </h2>
                  <p style={{ color: currentAppTheme.colors.primary }} className="text-[10px] font-bold uppercase tracking-wider">{t.purchaseHistoryDetail}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: currentAppTheme.colors.inputBg,
                  color: currentAppTheme.colors.textSecondary
                }}
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors active:scale-95 shrink-0 ml-2 border-0"
                aria-label={t.close}
                title={t.close}
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {viewingHistory.items.map(item => (
                <div 
                  key={item.id} 
                  style={{ backgroundColor: currentAppTheme.colors.inputBg }}
                  className="flex justify-between items-center p-3 rounded-xl border-0 gap-2"
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <span style={{ color: currentAppTheme.colors.text }} className="text-xs font-bold truncate">{item.name}</span>
                    <span style={{ color: currentAppTheme.colors.textSecondary }} className="text-[10px] font-medium">{item.quantity} {t.unitShort} • {localSettings.currency} {item.unitPrice.toLocaleString(locale, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span style={{ color: currentAppTheme.colors.primary }} className="text-xs font-black">
                      {localSettings.currency} {(item.unitPrice * item.quantity).toLocaleString(locale, { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddItemToShoppingList({ name: item.name, quantity: item.quantity, unitPrice: item.unitPrice, id: item.id })}
                      style={addedItemKey === item.id ? {
                        backgroundColor: '#16a34a',
                        color: '#FFFFFF'
                      } : {
                        backgroundColor: currentAppTheme.colors.primary,
                        color: '#FFFFFF'
                      }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 border-0 shadow-none"
                      title={t.addItemToShoppingList}
                      aria-label={t.addItemToShoppingList}
                    >
                      {addedItemKey === item.id ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <Plus className="w-4 h-4 stroke-[3]" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span style={{ color: currentAppTheme.colors.primary }} className="text-xs font-bold uppercase tracking-wider">{t.savedItems}</span>
                <span style={{ color: currentAppTheme.colors.text }} className="text-lg font-black">{localSettings.currency} {viewingHistory.totalValue.toLocaleString(locale, { minimumFractionDigits: 2 })}</span>
              </div>
              <button
                type="button"
                onClick={() => handleAddAllFromHistory(viewingHistory)}
                style={{
                  backgroundColor: currentAppTheme.colors.primary,
                  color: '#FFFFFF'
                }}
                className="w-full py-3 font-bold rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2 text-xs border-0 shadow-none"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{t.addAllFavoritesShort(viewingHistory.items.length)}</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 
                  style={{ color: currentAppTheme.colors.text }}
                  className="text-xl font-bold"
                >
                  {t.settingsTitle}
                </h2>
                <p 
                  style={{ color: currentAppTheme.colors.textSecondary }}
                  className="text-[10px] font-medium"
                >
                  {t.settingsSubtitle}
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: currentAppTheme.colors.inputBg,
                  color: currentAppTheme.colors.textSecondary
                }}
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors active:scale-95 shrink-0 border-0"
                aria-label={t.close}
                title={t.close}
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="space-y-6 overflow-y-auto max-h-[70vh] pb-4 custom-scrollbar pr-1">
              
              {/* Language Section (Opção de Idioma compacta: PT e US) */}
              <div>
                <div 
                  style={{
                    backgroundColor: currentAppTheme.colors.inputBg
                  }}
                  className="px-5 py-4 rounded-3xl flex items-center justify-between gap-3 border-0"
                >
                  <div className="min-w-0">
                    <label 
                      style={{ color: currentAppTheme.colors.primary }}
                      className="text-xs font-bold uppercase tracking-wider block"
                    >
                      {t.languageSectionTitle}
                    </label>
                    <p 
                      style={{ color: currentAppTheme.colors.textSecondary }}
                      className="text-[10px] font-medium truncate"
                    >
                      {t.languageSectionSubtitle}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const updated: AppSettings = { ...localSettings, language: 'pt' };
                        setLocalSettings(updated);
                        onUpdate(updated);
                      }}
                      style={(localSettings.language || 'pt') === 'pt' ? {
                        backgroundColor: currentAppTheme.colors.primary,
                        color: '#FFFFFF'
                      } : {
                        backgroundColor: currentAppTheme.colors.card,
                        color: currentAppTheme.colors.textSecondary
                      }}
                      className="w-11 h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-all active:scale-95 border-0 shadow-none"
                      aria-label="Português (PT)"
                    >
                      PT
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const updated: AppSettings = { ...localSettings, language: 'en' };
                        setLocalSettings(updated);
                        onUpdate(updated);
                      }}
                      style={localSettings.language === 'en' ? {
                        backgroundColor: currentAppTheme.colors.primary,
                        color: '#FFFFFF'
                      } : {
                        backgroundColor: currentAppTheme.colors.card,
                        color: currentAppTheme.colors.textSecondary
                      }}
                      className="w-11 h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-all active:scale-95 border-0 shadow-none"
                      aria-label="English (US)"
                    >
                      US
                    </button>
                  </div>
                </div>
              </div>

              {/* Theme Section (Opções compactas e minimalistas: Clássico e Floresta lado a lado) */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Palette className="w-4 h-4" style={{ color: currentAppTheme.colors.primary }} />
                    <label 
                      style={{ color: currentAppTheme.colors.primary }}
                      className="text-xs font-bold uppercase tracking-wider block"
                    >
                      {t.themeSectionTitle}
                    </label>
                  </div>
                  <span 
                    style={{ color: currentAppTheme.colors.textSecondary }}
                    className="text-[10px] font-medium"
                  >
                    {t.themeSectionSubtitle}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {(Object.keys(APP_THEMES) as AppThemeId[]).map((themeKey) => {
                    const themeItem = APP_THEMES[themeKey];
                    const currentThemeId: AppThemeId = (typeof localSettings.theme === 'string' && localSettings.theme in APP_THEMES)
                      ? (localSettings.theme as AppThemeId)
                      : DEFAULT_APP_THEME;
                    const isSelected = currentThemeId === themeKey;

                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => {
                          const updated: AppSettings = { ...localSettings, theme: themeKey };
                          setLocalSettings(updated);
                          onUpdate(updated);
                        }}
                        style={{
                          backgroundColor: currentAppTheme.colors.inputBg
                        }}
                        className="flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all active:scale-[0.98] border-0 shadow-none"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Pequena bolinha de cor ao lado */}
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs ring-2 ring-white"
                            style={{ backgroundColor: themeItem.colors.primary }}
                            aria-hidden="true"
                          />
                          {/* Nome do tema */}
                          <span 
                            className="text-xs font-bold truncate transition-colors"
                            style={{ color: isSelected ? themeItem.colors.primary : currentAppTheme.colors.text }}
                          >
                            {themeItem.name[currentLang] || themeItem.name.pt}
                          </span>
                        </div>

                        {/* Destaque / Check no selecionado */}
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'scale-100 text-white shadow-none'
                              : 'opacity-0 scale-75'
                          }`}
                          style={{
                            backgroundColor: isSelected ? themeItem.colors.primary : 'transparent'
                          }}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Currency Selection Section */}
              <div>
                <label 
                  style={{ color: currentAppTheme.colors.primary }}
                  className="text-xs font-bold uppercase tracking-wider block mb-3"
                >
                  {t.currencyTitle}
                </label>
                <div className="flex gap-3">
                  {currencies.map(curr => (
                    <button
                      key={curr}
                      onClick={() => {
                        const updated = { ...localSettings, currency: curr };
                        setLocalSettings(updated);
                        onUpdate(updated);
                      }}
                      style={localSettings.currency === curr ? {
                        backgroundColor: currentAppTheme.colors.primary,
                        color: '#FFFFFF'
                      } : {
                        backgroundColor: currentAppTheme.colors.inputBg,
                        color: currentAppTheme.colors.textSecondary
                      }}
                      className="flex-1 py-3 rounded-2xl transition-all font-bold active:scale-95 border-0 shadow-none"
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Section */}
              <div className="space-y-4">
                <div 
                  style={{ backgroundColor: currentAppTheme.colors.inputBg }}
                  className="p-6 rounded-3xl border-0 shadow-none"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <label 
                        style={{ color: currentAppTheme.colors.primary }}
                        className="text-xs font-bold uppercase tracking-wider block"
                      >
                        {t.budgetModeTitle}
                      </label>
                      <p 
                        style={{ color: currentAppTheme.colors.textSecondary }}
                        className="text-[10px] font-medium"
                      >
                        {t.budgetModeSubtitle}
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        const updated = { ...localSettings, isBudgetModeActive: !localSettings.isBudgetModeActive };
                        setLocalSettings(updated);
                        onUpdate(updated);
                      }}
                      style={{
                        backgroundColor: localSettings.isBudgetModeActive ? currentAppTheme.colors.primary : `${currentAppTheme.colors.textSecondary}40`
                      }}
                      className="w-12 h-6 rounded-full transition-colors flex items-center px-1 border-0"
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform transform ${localSettings.isBudgetModeActive ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  
                  {localSettings.isBudgetModeActive && (
                    <div className="mt-4 animate-in slide-in-from-top duration-200">
                      <label 
                        style={{ color: currentAppTheme.colors.primary }}
                        className="text-[10px] font-bold uppercase tracking-wider block mb-1"
                      >
                        {t.budgetLimitLabel}
                      </label>
                      <div className="relative">
                        <span 
                          style={{ color: currentAppTheme.colors.textSecondary }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium"
                        >
                          {localSettings.currency}
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={displayBudget}
                          onChange={(e) => handleBudgetChange(e.target.value)}
                          onBlur={() => {
                            if (localSettings.budgetLimit !== 0) {
                              setDisplayBudget(localSettings.budgetLimit.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                            } else {
                              setDisplayBudget('');
                            }
                          }}
                          placeholder={t.pricePlaceholder}
                          style={{
                            backgroundColor: currentAppTheme.colors.card,
                            color: currentAppTheme.colors.text
                          }}
                          className="w-full pl-11 pr-4 py-3 rounded-xl text-left font-bold border-0 outline-none transition-all shadow-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Swipe Gestures Section */}
              <div className="space-y-4">
                <div 
                  style={{ backgroundColor: currentAppTheme.colors.inputBg }}
                  className="p-6 rounded-3xl border-0 shadow-none"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <label 
                        style={{ color: currentAppTheme.colors.primary }}
                        className="text-xs font-bold uppercase tracking-wider block"
                      >
                        {t.swipeGesturesTitle}
                      </label>
                      <p 
                        style={{ color: currentAppTheme.colors.textSecondary }}
                        className="text-[10px] font-medium"
                      >
                        {t.swipeGesturesSubtitle}
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        const updated = { ...localSettings, isSwipeEnabled: !localSettings.isSwipeEnabled };
                        setLocalSettings(updated);
                        onUpdate(updated);
                      }}
                      style={{
                        backgroundColor: localSettings.isSwipeEnabled ? currentAppTheme.colors.primary : `${currentAppTheme.colors.textSecondary}40`
                      }}
                      className="w-12 h-6 rounded-full transition-colors flex items-center px-1 border-0"
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform transform ${localSettings.isSwipeEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {localSettings.isSwipeEnabled && (
                    <div className="space-y-6 animate-in slide-in-from-top duration-200">
                      {/* Right Swipe */}
                      <div>
                        <label 
                          style={{ color: currentAppTheme.colors.primary }}
                          className="text-[10px] font-bold uppercase tracking-wider block mb-2"
                        >
                          {t.swipeRightLabel}
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {swipeOptions.map(opt => (
                            <button
                              key={opt.val}
                              onClick={() => {
                                const updated = { ...localSettings, rightSwipeAction: opt.val };
                                setLocalSettings(updated);
                                onUpdate(updated);
                              }}
                              style={localSettings.rightSwipeAction === opt.val ? {
                                backgroundColor: currentAppTheme.colors.primary,
                                color: '#FFFFFF'
                              } : {
                                backgroundColor: currentAppTheme.colors.card,
                                color: currentAppTheme.colors.textSecondary
                              }}
                              className="py-2 px-1 rounded-xl text-[9px] font-bold transition-all border-0 shadow-none"
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Left Swipe */}
                      <div>
                        <label 
                          style={{ color: currentAppTheme.colors.primary }}
                          className="text-[10px] font-bold uppercase tracking-wider block mb-2"
                        >
                          {t.swipeLeftLabel}
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {swipeOptions.map(opt => (
                            <button
                              key={opt.val}
                              onClick={() => {
                                const updated = { ...localSettings, leftSwipeAction: opt.val };
                                setLocalSettings(updated);
                                onUpdate(updated);
                              }}
                              style={localSettings.leftSwipeAction === opt.val ? {
                                backgroundColor: currentAppTheme.colors.primary,
                                color: '#FFFFFF'
                              } : {
                                backgroundColor: currentAppTheme.colors.card,
                                color: currentAppTheme.colors.textSecondary
                              }}
                              className="py-2 px-1 rounded-xl text-[9px] font-bold transition-all border-0 shadow-none"
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Seção Favoritos: Linha clicável com ícone de estrela + nº de itens */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowFavoritesModal(true)}
                  style={{
                    backgroundColor: currentAppTheme.colors.inputBg
                  }}
                  className="w-full px-5 py-4 rounded-3xl border-0 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] group shadow-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div 
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-active:scale-95"
                      style={{
                        backgroundColor: currentAppTheme.colors.card,
                        color: '#D97706'
                      }}
                    >
                      <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span 
                          style={{ color: currentAppTheme.colors.text }}
                          className="text-xs font-bold uppercase tracking-tight block truncate"
                        >
                          {t.favoritesTitle}
                        </span>
                        <span 
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: currentAppTheme.colors.card,
                            color: currentAppTheme.colors.primary
                          }}
                        >
                          {(localSettings.favorites?.length || 0)} {(localSettings.favorites?.length === 1 ? 'item' : 'itens')}
                        </span>
                      </div>
                      <p 
                        style={{ color: currentAppTheme.colors.textSecondary }}
                        className="text-[10px] font-medium truncate mt-0.5"
                      >
                        {t.favoritesSubtitle}
                      </p>
                    </div>
                  </div>

                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5"
                    style={{
                      backgroundColor: currentAppTheme.colors.card,
                      color: currentAppTheme.colors.textSecondary
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              </div>

              {/* Seção Mais Comprados: Linha clicável (ícone de troféu + título) que abre o modal */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowMostPurchasedModal(true)}
                  style={{
                    backgroundColor: currentAppTheme.colors.inputBg
                  }}
                  className="w-full px-5 py-4 rounded-3xl border-0 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] group shadow-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div 
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-active:scale-95"
                      style={{
                        backgroundColor: currentAppTheme.colors.card,
                        color: '#D97706'
                      }}
                    >
                      <Trophy className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span 
                          style={{ color: currentAppTheme.colors.text }}
                          className="text-xs font-bold uppercase tracking-tight block truncate"
                        >
                          {t.mostPurchasedTitle}
                        </span>
                        {mostPurchasedItems.length > 0 && (
                          <span 
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: currentAppTheme.colors.card,
                              color: currentAppTheme.colors.primary
                            }}
                          >
                            {mostPurchasedItems.length} {mostPurchasedItems.length === 1 ? 'item' : 'itens'}
                          </span>
                        )}
                      </div>
                      <p 
                        style={{ color: currentAppTheme.colors.textSecondary }}
                        className="text-[10px] font-medium truncate mt-0.5"
                      >
                        {t.mostPurchasedSubtitle}
                      </p>
                    </div>
                  </div>

                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5"
                    style={{
                      backgroundColor: currentAppTheme.colors.card,
                      color: currentAppTheme.colors.textSecondary
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              </div>

              {/* History Section (Com botão '+' para reutilizar produtos em nova lista) */}
              <div className="space-y-4">
                <label 
                  style={{ color: currentAppTheme.colors.primary }}
                  className="text-xs font-bold uppercase tracking-wider block mb-4"
                >
                  {t.historyTitle}
                </label>
                <div className="space-y-3">
                  {localSettings.savedHistory && localSettings.savedHistory.length > 0 ? (
                    localSettings.savedHistory.map(history => (
                      <div 
                        key={history.id} 
                        style={{ backgroundColor: currentAppTheme.colors.inputBg }}
                        className="p-4 rounded-2xl border-0 flex justify-between items-center group shadow-none"
                      >
                        <div className="flex-1 min-w-0">
                          <p style={{ color: currentAppTheme.colors.text }} className="text-xs font-bold truncate">
                            {new Date(history.date).toLocaleDateString(locale, { month: 'long', year: 'numeric' }).charAt(0).toUpperCase() + new Date(history.date).toLocaleDateString(locale, { month: 'long', year: 'numeric' }).slice(1)}
                          </p>
                          <p style={{ color: currentAppTheme.colors.textSecondary }} className="text-[10px] font-medium">
                            {new Date(history.date).toLocaleDateString(locale)} • {t.historyItemsCount(history.totalItems)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span style={{ color: currentAppTheme.colors.text }} className="text-sm font-bold">
                            {localSettings.currency} {history.totalValue.toLocaleString(locale, { minimumFractionDigits: 2 })}
                          </span>
                          <div className="flex items-center gap-1">
                            {/* Botão para adicionar todos desta lista */}
                            <button
                              type="button"
                              onClick={() => handleAddAllFromHistory(history)}
                              style={{
                                backgroundColor: currentAppTheme.colors.primary,
                                color: '#FFFFFF'
                              }}
                              className="p-2 rounded-xl active:scale-90 transition-transform border-0 shadow-none"
                              title={t.addAllFavoritesShort(history.items.length)}
                              aria-label={t.addAllFavoritesShort(history.items.length)}
                            >
                              <Plus className="w-4 h-4 stroke-[2.5]" />
                            </button>
                            {/* Botão para visualizar itens e adicionar individualmente */}
                            <button 
                              onClick={() => setViewingHistory(history)}
                              style={{
                                backgroundColor: currentAppTheme.colors.card,
                                color: currentAppTheme.colors.primary
                              }}
                              className="p-2 rounded-xl active:scale-90 transition-transform border-0 shadow-none"
                              title={t.viewItems}
                              aria-label={t.viewItems}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => handleDeleteHistory(history.id)}
                              title={t.deleteHistory}
                              aria-label={t.deleteHistory}
                              style={{
                                backgroundColor: currentAppTheme.colors.deleteBg,
                                color: currentAppTheme.colors.deleteText
                              }}
                              className="p-2 rounded-xl transition-colors active:scale-90 border-0 shadow-none"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div 
                      style={{ backgroundColor: currentAppTheme.colors.inputBg }}
                      className="text-center py-8 rounded-3xl border-0 shadow-none"
                    >
                      <p style={{ color: currentAppTheme.colors.textSecondary }} className="text-xs font-medium">{t.noHistory}</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="pt-4 mt-2">
              <button 
                onClick={handleConfirm}
                style={{
                  backgroundColor: currentAppTheme.colors.primary,
                  color: '#FFFFFF'
                }}
                className="w-full py-4 font-bold rounded-2xl active:scale-95 transition-transform border-0 shadow-none"
              >
                {t.confirm}
              </button>
            </div>
          </>
        )}

        {/* Toast / Snackbar de Confirmação */}
        {historyToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none px-4 w-full max-w-xs">
            <div className="bg-gray-900/95 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-center gap-2 border border-gray-800">
              <div className="w-4 h-4 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3" strokeWidth={3} />
              </div>
              <span className="text-gray-100">{historyToast}</span>
            </div>
          </div>
        )}
      </div>

      {/* Janela / Modal de Favoritos */}
      {showFavoritesModal && (
        <div 
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowFavoritesModal(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div 
            className="relative w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 border-0 shadow-none flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300"
            style={{
              backgroundColor: currentAppTheme.colors.card,
              color: currentAppTheme.colors.text
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 rounded-full mx-auto mb-4 sm:hidden cursor-pointer opacity-30" style={{ backgroundColor: currentAppTheme.colors.textSecondary }} onClick={() => setShowFavoritesModal(false)} />

            {/* Header do Modal */}
            <div className="flex items-center justify-between pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: currentAppTheme.colors.inputBg, color: '#D97706' }}
                >
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 
                      style={{ color: currentAppTheme.colors.text }}
                      className="text-base font-bold tracking-tight truncate"
                    >
                      {t.favoritesTitle}
                    </h3>
                    <span 
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: currentAppTheme.colors.inputBg,
                        color: currentAppTheme.colors.primary
                      }}
                    >
                      {(localSettings.favorites?.length || 0)}
                    </span>
                  </div>
                  <p 
                    style={{ color: currentAppTheme.colors.textSecondary }}
                    className="text-[10px] font-medium truncate"
                  >
                    {t.favoritesSubtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowFavoritesModal(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors active:scale-95 shrink-0 border-0"
                style={{
                  backgroundColor: currentAppTheme.colors.inputBg,
                  color: currentAppTheme.colors.textSecondary
                }}
                aria-label={t.close}
                title={t.close}
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>

            {/* Conteúdo com rolagem suave */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar min-h-0">
              {/* 1. Formulário de Cadastro: flex-1 min-w-0 para caber sempre dentro do card, inclusive em telas pequenas */}
              <div 
                className="p-3 rounded-2xl border-0 flex gap-2 items-center"
                style={{
                  backgroundColor: currentAppTheme.colors.inputBg
                }}
              >
                <input
                  type="text"
                  value={newFavName}
                  onChange={(e) => setNewFavName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFavorite()}
                  placeholder={t.favoriteInputPlaceholder}
                  style={{
                    backgroundColor: currentAppTheme.colors.card,
                    color: currentAppTheme.colors.text
                  }}
                  className="flex-1 min-w-0 border-0 rounded-xl px-3 py-2 text-xs font-medium placeholder-gray-400 focus:outline-none transition-all shadow-none"
                />
                <input
                  type="number"
                  min="1"
                  value={newFavQty}
                  onChange={(e) => setNewFavQty(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFavorite()}
                  placeholder={t.favoriteQtyPlaceholder}
                  style={{
                    backgroundColor: currentAppTheme.colors.card,
                    color: currentAppTheme.colors.text
                  }}
                  className="w-14 shrink-0 border-0 rounded-xl px-2 py-2 text-xs font-bold text-center placeholder-gray-400 focus:outline-none transition-all shadow-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddFavorite()}
                  style={{
                    backgroundColor: currentAppTheme.colors.primary,
                    color: '#FFFFFF'
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center gap-1 border-0 shadow-none shrink-0"
                  title={t.addFavoriteBtn}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span className="hidden xs:inline sm:inline">{t.addFavoriteBtn}</span>
                </button>
              </div>

              {/* Botão Adicionar Todos mantido na janela quando houver favoritos */}
              {(localSettings.favorites && localSettings.favorites.length > 0) && (
                <button
                  type="button"
                  onClick={handleAddAllFavorites}
                  style={{
                    backgroundColor: currentAppTheme.colors.inputBg,
                    color: currentAppTheme.colors.primary
                  }}
                  className="w-full py-2.5 px-3 rounded-xl border-0 text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-none"
                  title={t.addAllFavorites}
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>{t.addAllFavoritesShort(localSettings.favorites.length)}</span>
                </button>
              )}

              {/* 2. Lista de todos os favoritos: visualizar, adicionar à lista (+) ou excluir */}
              <div className="space-y-2">
                {localSettings.favorites && localSettings.favorites.length > 0 ? (
                  localSettings.favorites.map(fav => (
                    <div 
                      key={fav.id}
                      style={{
                        backgroundColor: currentAppTheme.colors.inputBg
                      }}
                      className="p-3 rounded-xl border-0 flex items-center justify-between gap-2 transition-colors shadow-none"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        <div className="min-w-0">
                          <p 
                            style={{ color: currentAppTheme.colors.text }}
                            className="text-xs font-bold truncate"
                          >
                            {fav.name}
                          </p>
                          <p 
                            style={{ color: currentAppTheme.colors.textSecondary }}
                            className="text-[10px] font-medium"
                          >
                            {(fav.defaultQuantity || 1)} {t.unitShort}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAddItemToShoppingList({ name: fav.name, quantity: fav.defaultQuantity || 1, id: fav.id })}
                          style={addedItemKey === fav.id ? {
                            backgroundColor: '#16a34a',
                            color: '#FFFFFF'
                          } : {
                            backgroundColor: currentAppTheme.colors.primary,
                            color: '#FFFFFF'
                          }}
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 border-0 shadow-none"
                          title={t.addItemToShoppingList}
                          aria-label={t.addItemToShoppingList}
                        >
                          {addedItemKey === fav.id ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : (
                            <Plus className="w-4 h-4 stroke-[3]" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFavorite(fav.id)}
                          style={{
                            backgroundColor: currentAppTheme.colors.deleteBg,
                            color: currentAppTheme.colors.deleteText
                          }}
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors active:scale-90 border-0 shadow-none"
                          title="Excluir favorito"
                          aria-label="Excluir favorito"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div 
                    className="py-6 px-4 rounded-2xl border-0 text-center space-y-3 shadow-none"
                    style={{
                      backgroundColor: currentAppTheme.colors.inputBg
                    }}
                  >
                    <p 
                      style={{ color: currentAppTheme.colors.textSecondary }}
                      className="text-xs font-medium"
                    >
                      {t.noFavorites}
                    </p>
                    {/* Sugestões rápidas de 1-toque */}
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {['Leite', 'Pão Francês', 'Café', 'Ovos', 'Arroz', 'Açúcar'].map(item => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleAddFavorite(item)}
                          style={{
                            backgroundColor: currentAppTheme.colors.card,
                            color: currentAppTheme.colors.text
                          }}
                          className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border-0 transition-all flex items-center gap-1 active:scale-95 shadow-none"
                        >
                          <Plus className="w-2.5 h-2.5 stroke-[3]" />
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botão de Fechar no rodapé do modal */}
            <div className="pt-3 mt-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowFavoritesModal(false)}
                style={{
                  backgroundColor: currentAppTheme.colors.primary,
                  color: '#FFFFFF'
                }}
                className="w-full py-3 rounded-2xl font-bold text-xs active:scale-95 transition-transform border-0 shadow-none"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Janela / Modal de Mais Comprados (Ranking automático dos itens comprados) */}
      {showMostPurchasedModal && (
        <div 
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowMostPurchasedModal(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div 
            className="relative w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 border-0 shadow-none flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300"
            style={{
              backgroundColor: currentAppTheme.colors.card,
              color: currentAppTheme.colors.text
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 rounded-full mx-auto mb-4 sm:hidden cursor-pointer opacity-30" style={{ backgroundColor: currentAppTheme.colors.textSecondary }} onClick={() => setShowMostPurchasedModal(false)} />

            {/* Header do Modal */}
            <div className="flex items-center justify-between pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: currentAppTheme.colors.inputBg, color: '#D97706' }}
                >
                  <Trophy className="w-5 h-5 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 
                      style={{ color: currentAppTheme.colors.text }}
                      className="text-base font-bold tracking-tight truncate"
                    >
                      {t.mostPurchasedTitle}
                    </h3>
                    {mostPurchasedItems.length > 0 && (
                      <span 
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: currentAppTheme.colors.inputBg,
                          color: currentAppTheme.colors.primary
                        }}
                      >
                        {mostPurchasedItems.length}
                      </span>
                    )}
                  </div>
                  <p 
                    style={{ color: currentAppTheme.colors.textSecondary }}
                    className="text-[10px] font-medium truncate"
                  >
                    {t.mostPurchasedSubtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMostPurchasedModal(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors active:scale-95 shrink-0 border-0"
                style={{
                  backgroundColor: currentAppTheme.colors.inputBg,
                  color: currentAppTheme.colors.textSecondary
                }}
                aria-label={t.close}
                title={t.close}
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>

            {/* Seletor Top 5 e Top 10 */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <span 
                style={{ color: currentAppTheme.colors.primary }}
                className="text-xs font-bold uppercase tracking-wider"
              >
                Ranking
              </span>

              <div 
                className="flex items-center p-0.5 rounded-xl border-0 shrink-0"
                style={{
                  backgroundColor: currentAppTheme.colors.inputBg
                }}
              >
                <button
                  type="button"
                  onClick={() => setRankingTab('5')}
                  className="px-3 py-1 text-xs font-bold rounded-lg transition-all border-0 shadow-none"
                  style={rankingTab === '5' ? {
                    backgroundColor: currentAppTheme.colors.primary,
                    color: '#FFFFFF'
                  } : {
                    color: currentAppTheme.colors.textSecondary
                  }}
                >
                  {t.top5Rank}
                </button>
                <button
                  type="button"
                  onClick={() => setRankingTab('10')}
                  className="px-3 py-1 text-xs font-bold rounded-lg transition-all border-0 shadow-none"
                  style={rankingTab === '10' ? {
                    backgroundColor: currentAppTheme.colors.primary,
                    color: '#FFFFFF'
                  } : {
                    color: currentAppTheme.colors.textSecondary
                  }}
                >
                  {t.top10Rank}
                </button>
              </div>
            </div>

            {/* Conteúdo do Ranking com rolagem suave */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-0">
              {topItems.length > 0 ? (
                topItems.map((item, idx) => {
                  const rank = idx + 1;
                  const rankBadgeClass = 
                    rank === 1 ? 'bg-amber-500 text-white shadow-none' :
                    rank === 2 ? 'bg-slate-400 text-white' :
                    rank === 3 ? 'bg-amber-700 text-white' :
                    'bg-gray-300 text-gray-800';

                  const itemKey = `rank-modal-${item.name}`;

                  return (
                    <div 
                      key={item.name} 
                      className="p-3 rounded-2xl border-0 flex items-center justify-between gap-2 transition-colors shadow-none"
                      style={{
                        backgroundColor: currentAppTheme.colors.inputBg
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${rankBadgeClass}`}>
                          #{rank}
                        </span>
                        <div className="min-w-0">
                          <p 
                            style={{ color: currentAppTheme.colors.text }}
                            className="text-xs font-bold truncate"
                          >
                            {item.name}
                          </p>
                          <p 
                            style={{ color: currentAppTheme.colors.textSecondary }}
                            className="text-[10px] font-medium"
                          >
                            {t.purchasedStats(item.purchaseCount, item.totalQuantity)}
                            {item.lastUnitPrice > 0 && ` • ${localSettings.currency} ${item.lastUnitPrice.toLocaleString(locale, { minimumFractionDigits: 2 })}`}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddItemToShoppingList({ name: item.name, quantity: 1, unitPrice: item.lastUnitPrice, id: itemKey })}
                        style={addedItemKey === itemKey ? {
                          backgroundColor: '#16a34a',
                          color: '#FFFFFF'
                        } : {
                          backgroundColor: currentAppTheme.colors.primary,
                          color: '#FFFFFF'
                        }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 border-0 shadow-none shrink-0"
                        title={t.addItemToShoppingList}
                        aria-label={t.addItemToShoppingList}
                      >
                        {addedItemKey === itemKey ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <Plus className="w-4 h-4 stroke-[3]" />
                        )}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div 
                  className="py-10 px-4 rounded-2xl border-0 text-center space-y-2.5 shadow-none"
                  style={{
                    backgroundColor: currentAppTheme.colors.inputBg
                  }}
                >
                  <div 
                    className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center"
                    style={{ backgroundColor: currentAppTheme.colors.card, color: currentAppTheme.colors.primary }}
                  >
                    <Trophy className="w-6 h-6 opacity-60" />
                  </div>
                  <p 
                    style={{ color: currentAppTheme.colors.text }}
                    className="text-xs font-bold"
                  >
                    {t.noMostPurchased}
                  </p>
                  <p 
                    style={{ color: currentAppTheme.colors.textSecondary }}
                    className="text-[11px] font-medium max-w-xs mx-auto leading-relaxed"
                  >
                    {t.noMostPurchasedDesc}
                  </p>
                </div>
              )}
            </div>

            {/* Botão de Fechar no rodapé do modal */}
            <div className="pt-3 mt-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowMostPurchasedModal(false)}
                style={{
                  backgroundColor: currentAppTheme.colors.primary,
                  color: '#FFFFFF'
                }}
                className="w-full py-3 rounded-2xl font-bold text-xs active:scale-95 transition-transform border-0 shadow-none"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
