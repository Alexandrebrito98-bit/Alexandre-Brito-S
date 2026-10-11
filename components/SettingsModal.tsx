import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppSettings, SavedList, SwipeAction, FavoriteProduct, ShoppingItem } from '../types';
import { X, Check, Plus, Trash2, Trophy, Star, Palette } from 'lucide-react';
import { getTranslation } from '../i18n';
import { APP_THEMES, AppThemeId, DEFAULT_APP_THEME } from '../utils/appThemes';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdate: (s: AppSettings) => void;
  onClose: () => void;
  onAddItemToList?: (item: { name: string; quantity?: number; unitPrice?: number }) => void;
  onAddMultipleItemsToList?: (items: { name: string; quantity?: number; unitPrice?: number }[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  settings, 
  onUpdate, 
  onClose,
  onAddItemToList,
  onAddMultipleItemsToList
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>({
    ...settings,
    language: settings.language || 'pt',
  });

  const currentLang = localSettings.language || 'pt';
  const t = getTranslation(currentLang);
  const locale = currentLang === 'en' ? 'en-US' : 'pt-BR';

  const [displayBudget, setDisplayBudget] = useState(
    settings.budgetLimit === 0 ? '' : settings.budgetLimit.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
  const [viewingHistory, setViewingHistory] = useState<SavedList | null>(null);
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

  const currencies = ['R$', '$', '€', '£'];

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

  // Cálculo dos Mais Comprados baseado no histórico
  const mostPurchasedItems = useMemo(() => {
    const history = localSettings.savedHistory || [];
    if (history.length === 0) return [];

    const map = new Map<string, { name: string; purchaseCount: number; totalQuantity: number; lastUnitPrice: number }>();

    history.forEach(list => {
      list.items.forEach(item => {
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
      });
    });

    const list = Array.from(map.values());
    list.sort((a, b) => {
      if (b.purchaseCount !== a.purchaseCount) {
        return b.purchaseCount - a.purchaseCount;
      }
      return b.totalQuantity - a.totalQuantity;
    });

    return list;
  }, [localSettings.savedHistory]);

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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden cursor-pointer" onClick={onClose} />
        
        {viewingHistory ? (
          <div className="flex flex-col h-full max-h-[80vh]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  onClick={() => setViewingHistory(null)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 active:scale-90 transition-transform shrink-0"
                  aria-label={t.backToSettings}
                  title={t.back}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 leading-tight truncate">
                    {new Date(viewingHistory.date).toLocaleDateString(locale, { month: 'long', year: 'numeric' }).charAt(0).toUpperCase() + new Date(viewingHistory.date).toLocaleDateString(locale, { month: 'long', year: 'numeric' }).slice(1)}
                  </h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{t.purchaseHistoryDetail}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors active:scale-95 shrink-0 ml-2"
                aria-label={t.close}
                title={t.close}
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {viewingHistory.items.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 gap-2">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-bold text-gray-800 truncate">{item.name}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{item.quantity} {t.unitShort} • {localSettings.currency} {item.unitPrice.toLocaleString(locale, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-black text-blue-600">
                      {localSettings.currency} {(item.unitPrice * item.quantity).toLocaleString(locale, { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddItemToShoppingList({ name: item.name, quantity: item.quantity, unitPrice: item.unitPrice, id: item.id })}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-sm ${
                        addedItemKey === item.id 
                          ? 'bg-green-600 text-white' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
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

            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.savedItems}</span>
                <span className="text-lg font-black text-gray-900">{localSettings.currency} {viewingHistory.totalValue.toLocaleString(locale, { minimumFractionDigits: 2 })}</span>
              </div>
              <button
                type="button"
                onClick={() => handleAddAllFromHistory(viewingHistory)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-md shadow-blue-200 text-xs"
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
                <h2 className="text-xl font-bold text-gray-900">{t.settingsTitle}</h2>
                <p className="text-[10px] text-gray-400 font-medium">{t.settingsSubtitle}</p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors active:scale-95 shrink-0"
                aria-label={t.close}
                title={t.close}
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="space-y-6 overflow-y-auto max-h-[70vh] pb-4 custom-scrollbar pr-1">
              
              {/* Language Section (Opção de Idioma compacta: PT e US) */}
              <div>
                <div className="bg-gray-50 px-5 py-4 rounded-3xl border border-gray-100 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <label className="text-xs font-bold text-gray-900 uppercase tracking-tight block">
                      {t.languageSectionTitle}
                    </label>
                    <p className="text-[10px] text-gray-400 font-medium truncate">
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
                      className={`w-11 h-9 rounded-xl border text-xs font-bold flex items-center justify-center transition-all active:scale-95 ${
                        (localSettings.language || 'pt') === 'pt'
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
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
                      className={`w-11 h-9 rounded-xl border text-xs font-bold flex items-center justify-center transition-all active:scale-95 ${
                        localSettings.language === 'en'
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
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
                    <Palette className="w-4 h-4 text-gray-500" />
                    <label className="text-xs font-bold text-gray-900 uppercase tracking-tight block">
                      {t.themeSectionTitle}
                    </label>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">
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
                        className={`flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all active:scale-[0.98] ${
                          isSelected
                            ? 'border-2 shadow-xs'
                            : 'border bg-gray-50/70 hover:bg-gray-100/70 border-gray-200'
                        }`}
                        style={isSelected ? {
                          borderColor: themeItem.colors.primary,
                          backgroundColor: `${themeItem.colors.primary}0D`
                        } : undefined}
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
                            className={`text-xs font-bold truncate transition-colors ${
                              isSelected ? 'font-extrabold' : 'text-gray-700'
                            }`}
                            style={isSelected ? { color: themeItem.colors.primary } : undefined}
                          >
                            {themeItem.name[currentLang] || themeItem.name.pt}
                          </span>
                        </div>

                        {/* Destaque / Check no selecionado */}
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'scale-100 text-white shadow-xs'
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
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">
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
                      className={`flex-1 py-3 rounded-2xl border-2 transition-all font-bold active:scale-95 ${
                        localSettings.currency === curr
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-100 bg-gray-50 text-gray-400'
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Section */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <label className="text-xs font-bold text-gray-900 uppercase tracking-tight block">
                        {t.budgetModeTitle}
                      </label>
                      <p className="text-[10px] text-gray-400 font-medium">
                        {t.budgetModeSubtitle}
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        const updated = { ...localSettings, isBudgetModeActive: !localSettings.isBudgetModeActive };
                        setLocalSettings(updated);
                        onUpdate(updated);
                      }}
                      className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${localSettings.isBudgetModeActive ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform transform ${localSettings.isBudgetModeActive ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  
                  {localSettings.isBudgetModeActive && (
                    <div className="mt-4 animate-in slide-in-from-top duration-200">
                      <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">
                        {t.budgetLimitLabel}
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">{localSettings.currency}</span>
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
                          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-left font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Swipe Gestures Section */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <label className="text-xs font-bold text-gray-900 uppercase tracking-tight block">
                        {t.swipeGesturesTitle}
                      </label>
                      <p className="text-[10px] text-gray-400 font-medium">
                        {t.swipeGesturesSubtitle}
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        const updated = { ...localSettings, isSwipeEnabled: !localSettings.isSwipeEnabled };
                        setLocalSettings(updated);
                        onUpdate(updated);
                      }}
                      className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${localSettings.isSwipeEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform transform ${localSettings.isSwipeEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {localSettings.isSwipeEnabled && (
                    <div className="space-y-6 animate-in slide-in-from-top duration-200">
                      {/* Right Swipe */}
                      <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase block mb-2">
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
                              className={`py-2 px-1 rounded-xl border text-[9px] font-bold transition-all ${
                                localSettings.rightSwipeAction === opt.val
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-gray-200 text-gray-400'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Left Swipe */}
                      <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase block mb-2">
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
                              className={`py-2 px-1 rounded-xl border text-[9px] font-bold transition-all ${
                                localSettings.leftSwipeAction === opt.val
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-gray-200 text-gray-400'
                              }`}
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

              {/* Seção Favoritos (Cadastrar produtos frequentes com botão '+' e adicionar todos de uma vez) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <label className="text-xs font-bold text-gray-900 uppercase tracking-tight block">
                        {t.favoritesTitle}
                      </label>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {t.favoritesSubtitle}
                    </p>
                  </div>
                  {(localSettings.favorites && localSettings.favorites.length > 0) && (
                    <button
                      type="button"
                      onClick={handleAddAllFavorites}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-[10px] active:scale-95 transition-all flex items-center gap-1 shrink-0"
                      title={t.addAllFavorites}
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{t.addAllFavoritesShort(localSettings.favorites.length)}</span>
                    </button>
                  )}
                </div>

                {/* Input para cadastrar produto frequente */}
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex gap-2 items-center">
                  <input
                    type="text"
                    value={newFavName}
                    onChange={(e) => setNewFavName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddFavorite()}
                    placeholder={t.favoriteInputPlaceholder}
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    min="1"
                    value={newFavQty}
                    onChange={(e) => setNewFavQty(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddFavorite()}
                    placeholder={t.favoriteQtyPlaceholder}
                    className="w-14 bg-white border border-gray-200 rounded-xl px-2 py-2 text-xs font-bold text-center text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddFavorite()}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold active:scale-95 transition-transform flex items-center gap-1 shadow-sm shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{t.addFavoriteBtn}</span>
                  </button>
                </div>

                {/* Lista de Favoritos Cadastrados */}
                <div className="space-y-2">
                  {localSettings.favorites && localSettings.favorites.length > 0 ? (
                    localSettings.favorites.map(fav => (
                      <div key={fav.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between gap-2 group">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate">{fav.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium">
                              {(fav.defaultQuantity || 1)} {t.unitShort}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAddItemToShoppingList({ name: fav.name, quantity: fav.defaultQuantity || 1, id: fav.id })}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-sm ${
                              addedItemKey === fav.id 
                                ? 'bg-green-600 text-white' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
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
                            className="w-8 h-8 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors active:scale-90"
                            title="Excluir favorito"
                            aria-label="Excluir favorito"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 px-3 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                      <p className="text-[11px] text-gray-400 font-medium mb-2">{t.noFavorites}</p>
                      {/* Sugestões rápidas de 1-toque */}
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {['Leite', 'Pão Francês', 'Café', 'Ovos', 'Arroz', 'Açúcar'].map(item => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handleAddFavorite(item)}
                            className="text-[10px] font-bold px-2.5 py-1 bg-white hover:bg-amber-50 text-gray-600 hover:text-amber-700 rounded-lg border border-gray-200 transition-colors flex items-center gap-1 active:scale-95"
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

              {/* Seção Mais Comprados (Rankings 5 e 10 baseados no histórico) - Abaixo de Favoritos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <label className="text-xs font-bold text-gray-900 uppercase tracking-tight block">
                        {t.mostPurchasedTitle}
                      </label>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {t.mostPurchasedSubtitle}
                    </p>
                  </div>

                  {/* Toggle Top 5 e Top 10 */}
                  <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200 shrink-0">
                    <button
                      type="button"
                      onClick={() => setRankingTab('5')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        rankingTab === '5'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {t.top5Rank}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRankingTab('10')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        rankingTab === '10'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {t.top10Rank}
                    </button>
                  </div>
                </div>

                {/* Lista do Ranking */}
                <div className="space-y-2">
                  {topItems.length > 0 ? (
                    topItems.map((item, idx) => {
                      const rank = idx + 1;
                      const rankBadgeClass = 
                        rank === 1 ? 'bg-amber-500 text-white shadow-amber-200 shadow-sm' :
                        rank === 2 ? 'bg-slate-400 text-white' :
                        rank === 3 ? 'bg-amber-700 text-white' :
                        'bg-gray-200 text-gray-700';

                      const itemKey = `rank-${item.name}`;

                      return (
                        <div key={item.name} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${rankBadgeClass}`}>
                              #{rank}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                              <p className="text-[10px] text-gray-400 font-medium">
                                {t.purchasedStats(item.purchaseCount, item.totalQuantity)}
                                {item.lastUnitPrice > 0 && ` • ${localSettings.currency} ${item.lastUnitPrice.toLocaleString(locale, { minimumFractionDigits: 2 })}`}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddItemToShoppingList({ name: item.name, quantity: 1, unitPrice: item.lastUnitPrice, id: itemKey })}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-sm shrink-0 ${
                              addedItemKey === itemKey 
                                ? 'bg-green-600 text-white' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
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
                    <div className="py-6 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                      <p className="text-xs text-gray-400 font-medium">{t.noMostPurchased}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* History Section (Com botão '+' para reutilizar produtos em nova lista) */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-4">
                  {t.historyTitle}
                </label>
                <div className="space-y-3">
                  {localSettings.savedHistory && localSettings.savedHistory.length > 0 ? (
                    localSettings.savedHistory.map(history => (
                      <div key={history.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center group">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {new Date(history.date).toLocaleDateString(locale, { month: 'long', year: 'numeric' }).charAt(0).toUpperCase() + new Date(history.date).toLocaleDateString(locale, { month: 'long', year: 'numeric' }).slice(1)}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {new Date(history.date).toLocaleDateString(locale)} • {t.historyItemsCount(history.totalItems)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-bold text-gray-700">
                            {localSettings.currency} {history.totalValue.toLocaleString(locale, { minimumFractionDigits: 2 })}
                          </span>
                          <div className="flex items-center gap-1">
                            {/* Botão para adicionar todos desta lista */}
                            <button
                              type="button"
                              onClick={() => handleAddAllFromHistory(history)}
                              className="p-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl active:scale-90 transition-transform"
                              title={t.addAllFavoritesShort(history.items.length)}
                              aria-label={t.addAllFavoritesShort(history.items.length)}
                            >
                              <Plus className="w-4 h-4 stroke-[2.5]" />
                            </button>
                            {/* Botão para visualizar itens e adicionar individualmente */}
                            <button 
                              onClick={() => setViewingHistory(history)}
                              className="p-2 bg-blue-50 text-blue-600 rounded-xl active:scale-90 transition-transform"
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
                              className="p-2 text-red-400 hover:text-red-600 transition-colors opacity-90 sm:opacity-0 sm:group-hover:opacity-100 hover:opacity-100 active:scale-90"
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
                    <div className="text-center py-8 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      <p className="text-xs text-gray-400 font-medium">{t.noHistory}</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-gray-100 mt-2">
              <button 
                onClick={handleConfirm}
                className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl active:scale-95 transition-transform shadow-lg shadow-gray-200"
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
    </div>
  );
};
