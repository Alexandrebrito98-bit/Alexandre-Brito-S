
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingItem, AppSettings, SwipeAction } from '../types';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { Store, Check, X, ChevronDown } from 'lucide-react';
import { getTranslation } from '../i18n';
import { APP_THEMES, DEFAULT_APP_THEME, AppThemeId } from '../utils/appThemes';

interface ItemCardProps {
  item: ShoppingItem;
  onUpdate: (updates: Partial<ShoppingItem>) => void;
  onDelete: () => void;
  textSizeClass: string;
  titleSizeClass: string;
  settings: AppSettings;
  isViewMode?: boolean;
  onOpenSettingsMarkets?: () => void;
  onEditingChange?: (isEditing: boolean, mode?: 'hold' | 'edit') => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ 
  item, 
  onUpdate, 
  onDelete, 
  textSizeClass, 
  settings, 
  isViewMode = false,
  onOpenSettingsMarkets,
  onEditingChange
}) => {
  const currentLang = settings.language || 'pt';
  const t = getTranslation(currentLang);
  const locale = currentLang === 'en' ? 'en-US' : 'pt-BR';
  const currency = settings.currency;
  const [displayPrice, setDisplayPrice] = useState(
    item.unitPrice === 0 ? '' : item.unitPrice.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showMarketPicker, setShowMarketPicker] = useState(false);
  const getItemStatus = useCallback((): 'pending' | 'purchased' | 'unavailable' => {
    if (!item.isAvailable) return 'unavailable';
    if (item.isPurchased) return 'purchased';
    return 'pending';
  }, [item.isAvailable, item.isPurchased]);
  const [marketPickerStatus, setMarketPickerStatus] = useState<'pending' | 'purchased' | 'unavailable'>('pending');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(item.name);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [isHoldingName, setIsHoldingName] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const marketPickerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const dragGestureRef = useRef<{ isLocked: boolean; isHorizontal: boolean }>({ isLocked: false, isHorizontal: false });
  const isExecutingActionRef = useRef<boolean>(false);
  const nameHoldTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nameTouchStartRef = useRef<{ x: number; y: number } | null>(null);

  const associatedMarket = settings.isOrganizeByMarketEnabled && settings.markets
    ? settings.markets.find(m => m.id === item.marketId)
    : null;

  const notifyEditing = useCallback((active: boolean, mode: 'hold' | 'edit' = 'edit') => {
    if (onEditingChange) {
      onEditingChange(active, mode);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('superlist:item-editing', {
        detail: { active, mode }
      }));
    }
  }, [onEditingChange]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsLongPressing(false);
    touchStartPosRef.current = null;
  }, []);

  const cancelNameHold = useCallback(() => {
    if (nameHoldTimerRef.current) {
      clearTimeout(nameHoldTimerRef.current);
      nameHoldTimerRef.current = null;
    }
    setIsHoldingName(false);
    nameTouchStartRef.current = null;
    if (!isEditingName) {
      notifyEditing(false);
    }
  }, [isEditingName, notifyEditing]);

  const startEditing = useCallback(() => {
    setEditNameValue(item.name);
    setIsEditingName(true);
    setIsMenuOpen(false);
    notifyEditing(true, 'edit');
  }, [item.name, notifyEditing]);

  const handleNamePointerDown = (e: React.PointerEvent) => {
    if (isViewMode || isEditingName) return;
    // Impede que o swipe/drag ou menu do card interfira
    e.stopPropagation();

    cancelNameHold();
    cancelLongPress();

    nameTouchStartRef.current = { x: e.clientX, y: e.clientY };
    setIsHoldingName(true);
    notifyEditing(true, 'hold');

    nameHoldTimerRef.current = setTimeout(() => {
      cancelNameHold();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(60);
        } catch (_) {}
      }
      startEditing();
    }, 1000);
  };

  const handleNamePointerMove = (e: React.PointerEvent) => {
    if (!nameTouchStartRef.current) return;
    const dx = e.clientX - nameTouchStartRef.current.x;
    const dy = e.clientY - nameTouchStartRef.current.y;
    // Se o usuário mover mais de 10px (rolagem da página ou gesto), cancela o hold
    if (Math.hypot(dx, dy) > 10) {
      cancelNameHold();
    }
  };

  const handleNamePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    cancelNameHold();
  };

  const handleNamePointerCancel = () => {
    cancelNameHold();
  };

  const applyMarket = useCallback((targetMarketId?: string, status: 'pending' | 'purchased' | 'unavailable' = marketPickerStatus) => {
    const updates: Partial<ShoppingItem> = {
      marketId: targetMarketId
    };

    if (status === 'pending') {
      updates.isAvailable = true;
      updates.isPurchased = false;
    } else if (status === 'purchased') {
      updates.isAvailable = true;
      updates.isPurchased = true;
    } else if (status === 'unavailable') {
      updates.isAvailable = false;
      updates.isPurchased = false;
    }

    onUpdate(updates);
    setShowMarketPicker(false);
  }, [marketPickerStatus, onUpdate]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isViewMode || isEditingName || showDeleteConfirm || showMarketPicker) return;
    
    // Ignore clicks on buttons, inputs, action menu or product name
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('input') || 
      target.closest('[data-action-menu="true"]') ||
      target.closest('[data-item-name="true"]')
    ) {
      return;
    }

    cancelLongPress();
    cancelNameHold();
    touchStartPosRef.current = { x: e.clientX, y: e.clientY };
    dragGestureRef.current = { isLocked: false, isHorizontal: false };
    isExecutingActionRef.current = false;
    setIsLongPressing(true);

    longPressTimerRef.current = setTimeout(() => {
      setIsLongPressing(false);
      touchStartPosRef.current = null;
      setIsMenuOpen(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 1000);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!touchStartPosRef.current) return;
    const dx = e.clientX - touchStartPosRef.current.x;
    const dy = e.clientY - touchStartPosRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    // Cancel long press if moved more than 8px
    if (Math.hypot(dx, dy) > 8) {
      cancelLongPress();
    }

    // Direction locking: determine if gesture is predominantly horizontal or vertical
    if (!dragGestureRef.current.isLocked && (absX > 8 || absY > 8)) {
      dragGestureRef.current.isLocked = true;
      // Gesture is only considered horizontal if horizontal distance is clearly greater than vertical
      dragGestureRef.current.isHorizontal = absX > absY * 1.25;
    }
  };

  const handlePointerUp = () => {
    cancelLongPress();
  };

  const handlePointerCancel = () => {
    cancelLongPress();
    // Interrupted touch -> smoothly return item without triggering action
    dragGestureRef.current = { isLocked: false, isHorizontal: false };
    animate(x, 0, { type: 'spring', stiffness: 450, damping: 35 });
  };

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      if (nameHoldTimerRef.current) {
        clearTimeout(nameHoldTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (marketPickerRef.current && !marketPickerRef.current.contains(event.target as Node)) {
        setShowMarketPicker(false);
      }
    };
    if (isMenuOpen || showMarketPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, showMarketPicker]);

  useEffect(() => {
    if (isEditingName && editInputRef.current) {
      editInputRef.current.focus({ preventScroll: true });
      editInputRef.current.select();
      window.dispatchEvent(new CustomEvent('superlist:field-focused', { detail: editInputRef.current }));
    }
  }, [isEditingName]);

  useEffect(() => {
    if (settings.isSwipeEnabled) {
      setIsMenuOpen(false);
    }
  }, [settings.isSwipeEnabled]);


  useEffect(() => {
    const formatted = item.unitPrice === 0 ? '' : item.unitPrice.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const currentNumeric = parseFloat(displayPrice.replace(',', '.'));
    const isSameValue = isNaN(currentNumeric) ? item.unitPrice === 0 : currentNumeric === item.unitPrice;
    
    if (!isSameValue) {
      setDisplayPrice(formatted);
    }
  }, [item.unitPrice, locale]);

  const handlePriceChange = (val: string) => {
    const cleanVal = val.replace(/[^0-9.,]/g, '');
    const parts = cleanVal.split(/[.,]/);
    if (parts.length > 2) return;

    setDisplayPrice(cleanVal);
    const normalized = cleanVal.replace(',', '.');
    const price = parseFloat(normalized);
    onUpdate({ unitPrice: isNaN(price) ? 0 : price });
  };

  const handleAction = (callback: () => void) => {
    callback();
    setIsMenuOpen(false);
  };

  const saveName = () => {
    const trimmed = editNameValue.trim();
    if (trimmed && trimmed !== item.name) {
      onUpdate({ name: trimmed.charAt(0).toUpperCase() + trimmed.slice(1) });
    }
    setIsEditingName(false);
    notifyEditing(false);
  };

  const handlePriceBlur = () => {
    if (item.unitPrice !== 0) {
      setDisplayPrice(item.unitPrice.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    } else {
      setDisplayPrice('');
    }
  };

  const subtotal = item.unitPrice * item.quantity;

  const x = useMotionValue(0);

  const getActionColor = (action: SwipeAction) => {
    if (action === 'purchase') return '#10b981';
    if (action === 'unavailable') return '#fbbf24';
    if (action === 'delete') return '#ef4444';
    if (action === 'market') return '#6366f1';
    return '#ffffff';
  };

  const activeThemeId: AppThemeId = (typeof settings.theme === 'string' && settings.theme in APP_THEMES)
    ? (settings.theme as AppThemeId)
    : DEFAULT_APP_THEME;
  const currentAppTheme = APP_THEMES[activeThemeId] || APP_THEMES[DEFAULT_APP_THEME];

  const isDarkCard = currentAppTheme.isDark;
  const defaultCardBg = currentAppTheme.colors.itemCardBg || (currentAppTheme.isDark ? '#1E293B' : 'rgba(255, 255, 255, 0.7)');
  const itemCardBorder = currentAppTheme.colors.itemCardBorder || (activeThemeId === 'forest' ? 'rgba(31, 92, 63, 0.12)' : 'rgba(15, 23, 42, 0.08)');

  const background = useTransform(
    x,
    [-150, 0, 150],
    [
      getActionColor(settings.leftSwipeAction),
      defaultCardBg,
      getActionColor(settings.rightSwipeAction)
    ]
  );

  const scaleLeft = useTransform(x, [0, 100], [0.5, 1.2]);
  const scaleRight = useTransform(x, [-100, 0], [1.2, 0.5]);
  const opacityLeft = useTransform(x, [0, 80], [0, 1]);
  const opacityRight = useTransform(x, [-80, 0], [1, 0]);

  const renderSwipeIcon = (action: SwipeAction) => {
    if (action === 'purchase') {
      const isAlreadyPurchased = item.isPurchased && item.isAvailable;
      if (isAlreadyPurchased) {
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a5 5 0 015 5v2m-15-7l4-4m-4 4l4 4" />
          </svg>
        );
      }
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    if (action === 'unavailable') {
      const isAlreadyUnavailable = !item.isAvailable;
      if (isAlreadyUnavailable) {
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a5 5 0 015 5v2m-15-7l4-4m-4 4l4 4" />
          </svg>
        );
      }
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      );
    }
    if (action === 'market') {
      return <Store className="h-6 w-6" strokeWidth={2.5} />;
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    );
  };

  const getSwipeLabel = (action: SwipeAction) => {
    if (action === 'purchase') {
      const isAlreadyPurchased = item.isPurchased && item.isAvailable;
      return isAlreadyPurchased ? (t.swipeUnmark || 'Desmarcar') : t.swipeBuy;
    }
    if (action === 'unavailable') {
      const isAlreadyUnavailable = !item.isAvailable;
      return isAlreadyUnavailable ? (t.swipeUnmark || 'Desmarcar') : t.swipeUnavailable;
    }
    if (action === 'market') return 'Mercado';
    if (action === 'delete') return t.swipeDelete;
    return '';
  };

  const handleDragEnd = (_: any, info: any) => {
    cancelLongPress();
    if (!settings.isSwipeEnabled) {
      animate(x, 0, { type: 'spring', stiffness: 450, damping: 35 });
      return;
    }

    // Se o movimento foi predominantemente vertical ou não travado na horizontal, volta suavemente
    if (!dragGestureRef.current.isHorizontal) {
      dragGestureRef.current = { isLocked: false, isHorizontal: false };
      animate(x, 0, { type: 'spring', stiffness: 450, damping: 35 });
      return;
    }

    // Dynamic threshold: ~30% of card width (fallback to 90px if element not measured)
    const cardWidth = cardRef.current?.getBoundingClientRect().width || 320;
    const threshold = cardWidth * 0.3;

    const executeAction = (action: SwipeAction) => {
      if (isExecutingActionRef.current) return;
      isExecutingActionRef.current = true;

      if (action === 'purchase') {
        const isAlreadyPurchased = item.isPurchased && item.isAvailable;
        if (isAlreadyPurchased) {
          // Se já está Comprado, desmarca e volta para "Para comprar"
          onUpdate({ isPurchased: false, isAvailable: true });
        } else {
          // Se não está Comprado (estava Para comprar ou Indisponível), marca como Comprado
          onUpdate({ isPurchased: true, isAvailable: true });
        }
      } else if (action === 'unavailable') {
        const isAlreadyUnavailable = !item.isAvailable;
        if (isAlreadyUnavailable) {
          // Se já está Indisponível, desmarca e volta para "Para comprar"
          onUpdate({ isPurchased: false, isAvailable: true });
        } else {
          // Se não está Indisponível (estava Para comprar ou Comprado), marca como Indisponível
          onUpdate({ isAvailable: false, isPurchased: false });
        }
      } else if (action === 'delete') {
        setShowDeleteConfirm(true);
      } else if (action === 'market') {
        setMarketPickerStatus(getItemStatus());
        setShowMarketPicker(true);
      }

      // Reset execution guard after slight cooldown to prevent double firing
      setTimeout(() => {
        isExecutingActionRef.current = false;
      }, 350);
    };

    if (info.offset.x > threshold && settings.rightSwipeAction !== 'none') {
      executeAction(settings.rightSwipeAction);
    } else if (info.offset.x < -threshold && settings.leftSwipeAction !== 'none') {
      executeAction(settings.leftSwipeAction);
    }

    // Sempre reseta rastreamento e retorna o card suavemente
    dragGestureRef.current = { isLocked: false, isHorizontal: false };
    animate(x, 0, { type: 'spring', stiffness: 450, damping: 35 });
  };

  if (isViewMode) {
    return (
      <div 
        style={{
          backgroundColor: !item.isAvailable 
            ? (isDarkCard ? 'rgba(15, 23, 42, 0.4)' : 'rgba(0, 0, 0, 0.03)') 
            : defaultCardBg,
          borderColor: itemCardBorder
        }}
        className={`flex items-center py-2 sm:py-2.5 px-3 rounded-xl border my-1 transition-all ${!item.isAvailable ? (isDarkCard ? 'bg-slate-900/40' : 'bg-gray-50/50') : ''}`}
      >
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span 
              style={{
                color: !item.isAvailable ? currentAppTheme.colors.textSecondary : currentAppTheme.colors.text
              }}
              className={`font-bold truncate ${textSizeClass} ${
                !item.isAvailable ? 'line-through text-gray-400' : isDarkCard ? 'text-slate-100' : 'text-gray-800'
              }`}
            >
              {item.name}
            </span>
            <span 
              style={item.isAvailable ? { 
                backgroundColor: currentAppTheme.colors.chipAvailableBg,
                color: currentAppTheme.colors.chipAvailableText
              } : undefined}
              className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter shrink-0 shadow-none ${
                !item.isAvailable ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600'
              }`}
            >
              {item.quantity} {t.unitShort}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {item.isPurchased && item.isAvailable && (
              <span 
                style={{
                  backgroundColor: currentAppTheme.colors.chipPurchasedBg,
                  color: currentAppTheme.colors.chipPurchasedText
                }}
                className="text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase shadow-none"
              >
                {t.purchasedBadge}
              </span>
            )}
            {!item.isAvailable && (
              <span 
                style={{
                  backgroundColor: currentAppTheme.colors.chipUnavailableBg,
                  color: currentAppTheme.colors.chipUnavailableText
                }}
                className="text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase shadow-none"
              >
                {t.unavailableBadge}
              </span>
            )}
            {associatedMarket && (
              <span 
                style={{ backgroundColor: currentAppTheme.colors.inputBg, color: currentAppTheme.colors.textSecondary }}
                className="text-[8px] font-bold px-1.5 py-0.5 rounded-md tracking-tight shadow-none"
              >
                {associatedMarket.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0 text-right">
          <span 
            style={{
              color: !item.isAvailable ? currentAppTheme.colors.textSecondary : currentAppTheme.colors.text
            }}
            className={`font-bold ${textSizeClass} ${!item.isAvailable ? 'text-gray-400' : isDarkCard ? 'text-slate-200' : 'text-gray-700'}`}
          >
            {currency}{item.unitPrice.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span 
            style={{ color: currentAppTheme.colors.textSecondary }}
            className="text-[9px] font-medium"
          >
            {t.subtotal} {currency}{subtotal.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={cardRef}
      style={{
        backgroundColor: defaultCardBg,
        borderColor: itemCardBorder
      }}
      className="relative overflow-hidden item-card select-none my-1 rounded-xl border transition-all"
    >
      {/* Indicador visual de Long Press (~1s) */}
      {isLongPressing && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-100/60 overflow-hidden z-30 pointer-events-none rounded-t-lg">
          <div 
            style={{ backgroundColor: currentAppTheme.colors.primary }}
            className="h-full bg-blue-600 rounded-full animate-long-press" 
          />
        </div>
      )}

      {/* Swipe Backgrounds */}
      {settings.isSwipeEnabled && (
        <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none rounded-xl">
          {settings.rightSwipeAction !== 'none' && (
            <motion.div 
              style={{ opacity: opacityLeft, scale: scaleLeft }}
              className="flex flex-col items-center gap-1 text-white"
            >
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                {renderSwipeIcon(settings.rightSwipeAction)}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">
                {getSwipeLabel(settings.rightSwipeAction)}
              </span>
            </motion.div>
          )}
          {settings.leftSwipeAction !== 'none' && (
            <motion.div 
              style={{ opacity: opacityRight, scale: scaleRight }}
              className="flex flex-col items-center gap-1 text-white"
            >
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                {renderSwipeIcon(settings.leftSwipeAction)}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">
                {getSwipeLabel(settings.leftSwipeAction)}
              </span>
            </motion.div>
          )}
        </div>
      )}

      <motion.div
        drag={settings.isSwipeEnabled ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.65}
        dragTransition={{ bounceStiffness: 400, bounceDamping: 35 }}
        onDragStart={() => cancelLongPress()}
        onDragEnd={handleDragEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={() => {
          cancelLongPress();
          if (!isExecutingActionRef.current) {
            animate(x, 0, { type: 'spring', stiffness: 450, damping: 35 });
          }
        }}
        style={{ x, background }}
        className={`relative flex items-center py-2.5 sm:py-3 px-3 z-10 touch-pan-y transition-colors rounded-xl ${
          isLongPressing ? 'bg-blue-50/40' : !item.isAvailable ? 'bg-gray-50/50' : ''
        }`}
      >
        {/* Botão de 3 pontinhos (somente exibido quando Gestos ao Deslizar está DESATIVADO) */}
        {!settings.isSwipeEnabled && (
          <div className="relative mr-3 shrink-0">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={isMenuOpen ? {
                backgroundColor: currentAppTheme.colors.primary,
                color: '#FFFFFF'
              } : {
                backgroundColor: currentAppTheme.colors.inputBg,
                color: currentAppTheme.colors.textSecondary
              }}
              className="w-9 h-9 flex items-center justify-center rounded-xl border-0 transition-all active:scale-90"
              aria-label={t.itemOptions}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        )}

        {/* Menu de ações (acionado tanto pelos 3 pontinhos quanto pelo Long Press de ~2s) */}
        {isMenuOpen && (
          <>
            <div 
              className="fixed inset-0 z-[35]" 
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
              }} 
            />
            <div 
              ref={menuRef}
              data-action-menu="true"
              style={{
                backgroundColor: currentAppTheme.colors.inputBg,
                color: currentAppTheme.colors.text
              }}
              className={`absolute ${settings.isSwipeEnabled ? 'left-2' : 'left-12'} top-1/2 -translate-y-1/2 z-[40] flex items-center gap-1.5 shadow-2xl rounded-2xl p-1.5 border-0 animate-in fade-in zoom-in-95 duration-200`}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => handleAction(() => {
                  if (item.isPurchased && item.isAvailable) {
                    onUpdate({ isPurchased: false, isAvailable: true });
                  } else {
                    onUpdate({ isPurchased: true, isAvailable: true });
                  }
                })}
                title={item.isPurchased && item.isAvailable ? t.markToBuy : t.markPurchased}
                style={item.isPurchased && item.isAvailable ? {
                  backgroundColor: '#16a34a',
                  color: '#FFFFFF'
                } : {
                  backgroundColor: currentAppTheme.colors.card,
                  color: currentAppTheme.colors.textSecondary
                }}
                className="w-10 h-10 flex items-center justify-center rounded-xl border-0 transition-all active:scale-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
              <button 
                onClick={startEditing}
                title={t.editName}
                style={{
                  backgroundColor: currentAppTheme.colors.card,
                  color: currentAppTheme.colors.textSecondary
                }}
                className="w-10 h-10 flex items-center justify-center rounded-xl border-0 transition-all active:scale-90 hover:opacity-80"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button 
                onClick={() => handleAction(() => {
                  if (!item.isAvailable) {
                    onUpdate({ isAvailable: true, isPurchased: false });
                  } else {
                    onUpdate({ isAvailable: false, isPurchased: false });
                  }
                })}
                title={!item.isAvailable ? t.markAvailable : t.markUnavailable}
                style={!item.isAvailable ? {
                  backgroundColor: '#EAB308',
                  color: '#FFFFFF'
                } : {
                  backgroundColor: currentAppTheme.colors.card,
                  color: currentAppTheme.colors.textSecondary
                }}
                className="w-10 h-10 flex items-center justify-center rounded-xl border-0 transition-all active:scale-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </button>
              {settings.isOrganizeByMarketEnabled && (
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    setMarketPickerStatus(getItemStatus());
                    setShowMarketPicker(true);
                  }}
                  title="Definir mercado"
                  style={associatedMarket ? {
                    backgroundColor: currentAppTheme.colors.primary,
                    color: '#FFFFFF'
                  } : {
                    backgroundColor: currentAppTheme.colors.card,
                    color: currentAppTheme.colors.textSecondary
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border-0 transition-all active:scale-90"
                >
                  <Store className="w-5 h-5" strokeWidth={2} />
                </button>
              )}
              {/* Botão de excluir: fundo vermelho bem claro com ícone vermelho */}
              <button 
                onClick={() => {
                  setIsMenuOpen(false);
                  setShowDeleteConfirm(true);
                }}
                title={t.deleteItem}
                style={{
                  backgroundColor: currentAppTheme.colors.deleteBg,
                  color: currentAppTheme.colors.deleteText
                }}
                className="w-10 h-10 flex items-center justify-center rounded-xl border-0 transition-all active:scale-90 hover:opacity-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </>
        )}

        <div className="flex flex-col flex-1 pr-2 min-w-0">
          <div className="flex items-center">
            {/* Controle − 1 + dos itens: fundo um tom acima do fundo da tela, cantos arredondados, sem borda */}
            <div 
              style={{
                backgroundColor: currentAppTheme.colors.inputBg
              }}
              className="flex items-center rounded-xl p-0.5 border-0 mr-2 shrink-0"
            >
              <button 
                onClick={() => onUpdate({ quantity: Math.max(1, item.quantity - 1) })}
                className="w-7 h-7 flex items-center justify-center font-bold active:scale-95 rounded-lg transition-colors text-xs border-0"
                style={{ color: currentAppTheme.colors.primary }}
              >
                −
              </button>
              <span 
                style={{ color: currentAppTheme.colors.text }}
                className="w-6 text-center font-bold text-[11px]"
              >
                {item.quantity}
              </span>
              <button 
                onClick={() => onUpdate({ quantity: item.quantity + 1 })}
                className="w-7 h-7 flex items-center justify-center font-bold active:scale-95 rounded-lg transition-colors text-xs border-0"
                style={{ color: currentAppTheme.colors.primary }}
              >
                +
              </button>
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              {isEditingName ? (
                <input
                  ref={editInputRef}
                  type="text"
                  data-item-name-input="true"
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  onBlur={saveName}
                  onKeyDown={(e) => e.key === 'Enter' && saveName()}
                  style={{
                    backgroundColor: currentAppTheme.colors.inputBg,
                    color: currentAppTheme.colors.text
                  }}
                  className={`w-full border-0 rounded-xl px-2 py-1 font-bold outline-none ${textSizeClass}`}
                />
              ) : (
                <div 
                  data-item-name="true"
                  onPointerDown={handleNamePointerDown}
                  onPointerMove={handleNamePointerMove}
                  onPointerUp={handleNamePointerUp}
                  onPointerCancel={handleNamePointerCancel}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ WebkitTouchCallout: 'none' }}
                  className={`relative inline-flex flex-col max-w-full cursor-pointer select-none rounded-md px-1 -mx-1 py-0.5 transition-all ${
                    isHoldingName ? 'opacity-70 scale-[0.98]' : 'active:opacity-80'
                  }`}
                  title={t.holdToEditTitle}
                >
                  <span 
                    style={{ color: !item.isAvailable ? currentAppTheme.colors.textSecondary : currentAppTheme.colors.text }}
                    className={`font-bold truncate ${textSizeClass} ${
                      !item.isAvailable ? 'line-through opacity-60' : ''
                    }`}
                  >
                    {item.name}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {item.isPurchased && item.isAvailable && (
                  <span 
                    style={{ backgroundColor: currentAppTheme.colors.chipPurchasedBg, color: currentAppTheme.colors.chipPurchasedText }}
                    className="text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tight"
                  >
                    {t.purchasedBadge}
                  </span>
                )}
                {!item.isAvailable && (
                  <span 
                    style={{ backgroundColor: currentAppTheme.colors.chipUnavailableBg, color: currentAppTheme.colors.chipUnavailableText }}
                    className="text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tight"
                  >
                    {t.unavailableBadge}
                  </span>
                )}
                {associatedMarket && (
                  <span 
                    style={{ backgroundColor: currentAppTheme.colors.inputBg, color: currentAppTheme.colors.textSecondary }}
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-1 tracking-tight"
                  >
                    <Store className="w-2.5 h-2.5 opacity-60" />
                    {associatedMarket.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preço e subtotal alinhados à direita */}
        <div className="flex flex-col items-end shrink-0 ml-1 text-right">
          <div className="flex items-center justify-end">
            <span style={{ color: currentAppTheme.colors.textSecondary }} className="text-[9px] font-medium mr-0.5">{currency}</span>
            <input
              type="text"
              inputMode="decimal"
              value={displayPrice}
              onFocus={() => notifyEditing(true, 'edit')}
              onChange={(e) => handlePriceChange(e.target.value)}
              onBlur={() => {
                handlePriceBlur();
                notifyEditing(false);
              }}
              placeholder={t.pricePlaceholder}
              style={{
                color: item.isPurchased && item.isAvailable ? '#16a34a' : currentAppTheme.colors.text
              }}
              className={`w-16 bg-transparent border-none text-right font-bold transition-colors focus:ring-0 p-0 outline-none ${textSizeClass}`}
            />
          </div>
          <div style={{ color: currentAppTheme.colors.textSecondary }} className="text-[9px] mt-0.5 flex items-center text-right justify-end">
            <span className="mr-1">{t.subtotal}</span>
            <span style={{ color: currentAppTheme.colors.text }} className="font-bold text-right">
              {currency}{subtotal.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center px-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirm(false);
          }}
        >
          <div 
            style={{
              backgroundColor: currentAppTheme.colors.card,
              color: currentAppTheme.colors.text
            }}
            className="rounded-2xl p-5 max-w-xs w-full shadow-2xl border-0 animate-in zoom-in-95 duration-150 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão de excluir: fundo vermelho bem claro com ícone vermelho */}
            <div 
              style={{
                backgroundColor: currentAppTheme.colors.deleteBg,
                color: currentAppTheme.colors.deleteText
              }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 
              style={{ color: currentAppTheme.colors.text }}
              className="font-bold text-base mb-1"
            >
              {t.deleteConfirmTitle}
            </h3>
            <p 
              style={{ color: currentAppTheme.colors.textSecondary }}
              className="text-xs mb-5 leading-relaxed"
            >
              {t.deleteConfirmDesc(item.name)}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  backgroundColor: currentAppTheme.colors.inputBg,
                  color: currentAppTheme.colors.textSecondary
                }}
                className="flex-1 py-2.5 px-3 rounded-xl border-0 text-xs font-bold active:scale-95 transition-all"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete();
                }}
                style={{
                  backgroundColor: currentAppTheme.colors.deleteText,
                  color: '#FFFFFF'
                }}
                className="flex-1 py-2.5 px-3 rounded-xl border-0 text-xs font-bold shadow-none active:scale-95 transition-all"
              >
                {t.deleteConfirmAction}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seletor discreto de mercado */}
      {showMarketPicker && (
        <div 
          className="fixed inset-0 z-[65] flex items-center justify-center px-4 bg-black/30 backdrop-blur-[1px] animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation();
            setShowMarketPicker(false);
          }}
        >
          <div 
            ref={marketPickerRef}
            data-action-menu="true"
            style={{
              backgroundColor: currentAppTheme.colors.card,
              color: currentAppTheme.colors.text
            }}
            className="rounded-2xl p-4 max-w-xs w-full shadow-2xl border-0 animate-in zoom-in-95 duration-150 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 mb-3">
              <div className="flex items-center gap-2">
                <div 
                  style={{
                    backgroundColor: currentAppTheme.colors.inputBg,
                    color: currentAppTheme.colors.primary
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                >
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h4 style={{ color: currentAppTheme.colors.text }} className="font-bold text-xs">Escolher mercado</h4>
                  <p style={{ color: currentAppTheme.colors.textSecondary }} className="text-[10px] truncate max-w-[170px]">{item.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMarketPicker(false)}
                style={{
                  backgroundColor: currentAppTheme.colors.inputBg,
                  color: currentAppTheme.colors.textSecondary
                }}
                className="w-6 h-6 flex items-center justify-center rounded-lg active:scale-90 transition-all border-0"
                aria-label="Fechar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {(settings.markets && settings.markets.length > 0) ? (
              <>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5 custom-scrollbar">
                  {settings.markets.map(market => {
                    const isSelected = item.marketId === market.id;
                    return (
                      <button
                        key={market.id}
                        type="button"
                        onClick={() => applyMarket(market.id, marketPickerStatus)}
                        style={isSelected ? {
                          backgroundColor: currentAppTheme.colors.primary,
                          color: '#FFFFFF'
                        } : {
                          backgroundColor: currentAppTheme.colors.inputBg,
                          color: currentAppTheme.colors.text
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] border-0"
                      >
                        <span className="truncate">{market.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-white shrink-0" strokeWidth={2.5} />}
                      </button>
                    );
                  })}

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => applyMarket(undefined, marketPickerStatus)}
                      style={!item.marketId ? {
                        backgroundColor: currentAppTheme.colors.primary,
                        color: '#FFFFFF'
                      } : {
                        backgroundColor: currentAppTheme.colors.inputBg,
                        color: currentAppTheme.colors.textSecondary
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all active:scale-[0.98] border-0"
                    >
                      <span>Sem mercado</span>
                      {!item.marketId && <Check className="w-3.5 h-3.5 text-white shrink-0" strokeWidth={2} />}
                    </button>
                  </div>
                </div>

                {/* Seletor de Estado */}
                <div className="pt-3 mt-3">
                  <label htmlFor="item-status-select" style={{ color: currentAppTheme.colors.primary }} className="block text-[11px] font-bold uppercase tracking-wider mb-1.5">
                    Estado:
                  </label>

                  <div className="relative">
                    <select
                      id="item-status-select"
                      value={marketPickerStatus}
                      onChange={(e) => setMarketPickerStatus(e.target.value as 'pending' | 'purchased' | 'unavailable')}
                      style={{
                        backgroundColor: currentAppTheme.colors.inputBg,
                        color: currentAppTheme.colors.text
                      }}
                      className="w-full appearance-none text-xs font-bold py-2.5 pl-3.5 pr-9 rounded-xl outline-none border-0 transition-all cursor-pointer"
                    >
                      <option value="pending">Para Comprar</option>
                      <option value="purchased">Comprado</option>
                      <option value="unavailable">Indisponível</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3" style={{ color: currentAppTheme.colors.textSecondary }}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => applyMarket(item.marketId, marketPickerStatus)}
                    style={{
                      backgroundColor: currentAppTheme.colors.primary,
                      color: '#FFFFFF'
                    }}
                    className="w-full mt-2.5 py-2 px-3 text-xs font-bold rounded-xl active:scale-95 transition-all border-0 shadow-none"
                  >
                    Confirmar
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-2">
                <p style={{ color: currentAppTheme.colors.textSecondary }} className="text-xs font-medium mb-3">
                  Você ainda não cadastrou nenhum mercado.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowMarketPicker(false);
                    if (onOpenSettingsMarkets) {
                      onOpenSettingsMarkets();
                    }
                  }}
                  style={{
                    backgroundColor: currentAppTheme.colors.primary,
                    color: '#FFFFFF'
                  }}
                  className="w-full py-2.5 px-3 text-xs font-bold rounded-xl active:scale-95 transition-all border-0 shadow-none"
                >
                  Configurar mercados
                </button>

                <div className="pt-3 mt-3">
                  <label htmlFor="item-status-select-empty" style={{ color: currentAppTheme.colors.primary }} className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-left">
                    Estado:
                  </label>
                  <div className="relative">
                    <select
                      id="item-status-select-empty"
                      value={marketPickerStatus}
                      onChange={(e) => setMarketPickerStatus(e.target.value as 'pending' | 'purchased' | 'unavailable')}
                      style={{
                        backgroundColor: currentAppTheme.colors.inputBg,
                        color: currentAppTheme.colors.text
                      }}
                      className="w-full appearance-none text-xs font-bold py-2.5 pl-3.5 pr-9 rounded-xl outline-none border-0 transition-all cursor-pointer"
                    >
                      <option value="pending">Para Comprar</option>
                      <option value="purchased">Comprado</option>
                      <option value="unavailable">Indisponível</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3" style={{ color: currentAppTheme.colors.textSecondary }}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => applyMarket(item.marketId, marketPickerStatus)}
                    style={{
                      backgroundColor: currentAppTheme.colors.primary,
                      color: '#FFFFFF'
                    }}
                    className="w-full mt-2.5 py-2 px-3 text-xs font-bold rounded-xl active:scale-95 transition-all border-0 shadow-none"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
