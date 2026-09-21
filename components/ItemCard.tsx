
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingItem, AppSettings, SwipeAction } from '../types';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Store, Check, X, ChevronDown } from 'lucide-react';

interface ItemCardProps {
  item: ShoppingItem;
  onUpdate: (updates: Partial<ShoppingItem>) => void;
  onDelete: () => void;
  textSizeClass: string;
  titleSizeClass: string;
  settings: AppSettings;
  isViewMode?: boolean;
  onOpenSettingsMarkets?: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ 
  item, 
  onUpdate, 
  onDelete, 
  textSizeClass, 
  settings, 
  isViewMode = false,
  onOpenSettingsMarkets
}) => {
  const currency = settings.currency;
  const [displayPrice, setDisplayPrice] = useState(
    item.unitPrice === 0 ? '' : item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const marketPickerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const associatedMarket = settings.isOrganizeByMarketEnabled && settings.markets
    ? settings.markets.find(m => m.id === item.marketId)
    : null;

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsLongPressing(false);
    touchStartPosRef.current = null;
  }, []);

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
    
    // Ignore clicks on buttons, inputs or action menu
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('input') || 
      target.closest('[data-action-menu="true"]')
    ) {
      return;
    }

    cancelLongPress();
    touchStartPosRef.current = { x: e.clientX, y: e.clientY };
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
    // Cancel if movement exceeds 10px in any direction (scroll or swipe)
    if (Math.hypot(dx, dy) > 10) {
      cancelLongPress();
    }
  };

  const handlePointerUp = () => {
    cancelLongPress();
  };

  const handlePointerCancel = () => {
    cancelLongPress();
  };

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
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
    const formatted = item.unitPrice === 0 ? '' : item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const currentNumeric = parseFloat(displayPrice.replace(',', '.'));
    const isSameValue = isNaN(currentNumeric) ? item.unitPrice === 0 : currentNumeric === item.unitPrice;
    
    if (!isSameValue) {
      setDisplayPrice(formatted);
    }
  }, [item.unitPrice]);

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

  const startEditing = () => {
    setEditNameValue(item.name);
    setIsEditingName(true);
    setIsMenuOpen(false);
  };

  const saveName = () => {
    const trimmed = editNameValue.trim();
    if (trimmed && trimmed !== item.name) {
      onUpdate({ name: trimmed.charAt(0).toUpperCase() + trimmed.slice(1) });
    }
    setIsEditingName(false);
  };

  const handlePriceBlur = () => {
    if (item.unitPrice !== 0) {
      setDisplayPrice(item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
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

  const background = useTransform(
    x,
    [-150, 0, 150],
    [
      getActionColor(settings.leftSwipeAction),
      '#ffffff',
      getActionColor(settings.rightSwipeAction)
    ]
  );

  const scaleLeft = useTransform(x, [0, 100], [0.5, 1.2]);
  const scaleRight = useTransform(x, [-100, 0], [1.2, 0.5]);
  const opacityLeft = useTransform(x, [0, 80], [0, 1]);
  const opacityRight = useTransform(x, [-80, 0], [1, 0]);

  const renderSwipeIcon = (action: SwipeAction) => {
    if (action === 'purchase') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    if (action === 'unavailable') {
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
    if (action === 'purchase') return 'Comprado';
    if (action === 'unavailable') return 'Indisponível';
    if (action === 'market') return 'Mercado';
    if (action === 'delete') return 'Excluir';
    return '';
  };

  const handleDragEnd = (_: any, info: any) => {
    cancelLongPress();
    if (!settings.isSwipeEnabled) return;
    const threshold = 100;
    
    const executeAction = (action: SwipeAction) => {
      if (action === 'purchase') {
        onUpdate({ isPurchased: !item.isPurchased });
      } else if (action === 'unavailable') {
        onUpdate({ isAvailable: !item.isAvailable });
      } else if (action === 'delete') {
        setShowDeleteConfirm(true);
      } else if (action === 'market') {
        setMarketPickerStatus(getItemStatus());
        setShowMarketPicker(true);
      }
    };

    if (info.offset.x > threshold && settings.rightSwipeAction !== 'none') {
      executeAction(settings.rightSwipeAction);
    } else if (info.offset.x < -threshold && settings.leftSwipeAction !== 'none') {
      executeAction(settings.leftSwipeAction);
    }
  };

  if (isViewMode) {
    return (
      <div className={`flex items-center py-3.5 px-3 transition-all border-b border-gray-100 last:border-0 ${!item.isAvailable ? 'bg-gray-50/50' : ''}`}>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-bold text-gray-800 truncate ${textSizeClass} ${!item.isAvailable ? 'line-through text-gray-400' : ''}`}>
              {item.name}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter shrink-0 ${
              !item.isAvailable ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600'
            }`}>
              {item.quantity} un
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {item.isPurchased && item.isAvailable && (
              <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md font-black uppercase">Comprado</span>
            )}
            {!item.isAvailable && (
              <span className="text-[8px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-md font-black uppercase">Indisponível</span>
            )}
            {associatedMarket && (
              <span className="text-[8px] text-gray-500 font-bold bg-gray-100 px-1.5 py-0.5 rounded-md tracking-tight">
                {associatedMarket.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <span className={`font-bold text-gray-700 ${textSizeClass} ${!item.isAvailable ? 'text-gray-400' : ''}`}>
            {currency} {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[9px] text-gray-400 font-medium">
            Sub: {currency} {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden border-b border-gray-100 last:border-0 item-card select-none">
      {/* Indicador visual de Long Press (~1s) */}
      {isLongPressing && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-100/60 overflow-hidden z-30 pointer-events-none rounded-t-lg">
          <div className="h-full bg-blue-600 rounded-full animate-long-press" />
        </div>
      )}

      {/* Swipe Backgrounds */}
      {settings.isSwipeEnabled && (
        <div className="absolute inset-0 flex items-center justify-between px-8 pointer-events-none">
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
        dragElastic={0.7}
        onDragStart={() => cancelLongPress()}
        onDragEnd={handleDragEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={cancelLongPress}
        style={{ x, background }}
        className={`relative flex items-center py-4 px-1 z-10 touch-pan-y transition-colors ${
          isLongPressing ? 'bg-blue-50/40' : !item.isAvailable ? 'bg-gray-50/50' : ''
        }`}
      >
        {/* Botão de 3 pontinhos (somente exibido quando Gestos ao Deslizar está DESATIVADO) */}
        {!settings.isSwipeEnabled && (
          <div className="relative mr-3 shrink-0">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 ${
                isMenuOpen ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
              aria-label="Opções do item"
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
              className={`absolute ${settings.isSwipeEnabled ? 'left-2' : 'left-12'} top-1/2 -translate-y-1/2 z-[40] flex items-center gap-1.5 bg-white border border-gray-100 shadow-2xl rounded-2xl p-1.5 animate-in fade-in zoom-in-95 duration-200`}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => handleAction(() => onUpdate({ isPurchased: !item.isPurchased }))}
                title={item.isPurchased ? "Marcar como a comprar" : "Marcar como comprado"}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 ${
                  item.isPurchased && item.isAvailable ? 'bg-green-500 text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
              <button 
                onClick={startEditing}
                title="Editar nome"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-50 active:text-blue-600 transition-all active:scale-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button 
                onClick={() => handleAction(() => onUpdate({ isAvailable: !item.isAvailable }))}
                title={!item.isAvailable ? "Marcar como disponível" : "Marcar como indisponível"}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 ${
                  !item.isAvailable ? 'bg-yellow-400 text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
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
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 ${
                    associatedMarket ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  <Store className="w-5 h-5" strokeWidth={2} />
                </button>
              )}
              <button 
                onClick={() => {
                  setIsMenuOpen(false);
                  setShowDeleteConfirm(true);
                }}
                title="Excluir item"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all active:scale-90"
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
            <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100 mr-2 shrink-0">
              <button 
                onClick={() => onUpdate({ quantity: Math.max(1, item.quantity - 1) })}
                className="w-7 h-7 flex items-center justify-center text-blue-600 font-bold active:bg-white rounded-md transition-colors text-xs"
              >
                −
              </button>
              <span className="w-6 text-center font-bold text-gray-700 text-[11px]">{item.quantity}</span>
              <button 
                onClick={() => onUpdate({ quantity: item.quantity + 1 })}
                className="w-7 h-7 flex items-center justify-center text-blue-600 font-bold active:bg-white rounded-md transition-colors text-xs"
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
                  className={`w-full bg-blue-50 border border-blue-200 rounded-md px-1 py-0.5 font-bold text-gray-800 outline-none focus:ring-1 focus:ring-blue-400 ${textSizeClass}`}
                />
              ) : (
                <span 
                  onClick={startEditing}
                  className={`font-bold text-gray-800 truncate cursor-text ${textSizeClass} ${!item.isAvailable ? 'line-through text-gray-400' : ''}`}
                >
                  {item.name}
                </span>
              )}
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {item.isPurchased && item.isAvailable && (
                  <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md font-black uppercase tracking-tight">Comprado</span>
                )}
                {!item.isAvailable && (
                  <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-md font-black uppercase tracking-tight">Indisponível</span>
                )}
                {associatedMarket && (
                  <span className="text-[9px] text-gray-500 font-semibold bg-gray-100 px-1.5 py-0.5 rounded-md flex items-center gap-1 tracking-tight">
                    <Store className="w-2.5 h-2.5 text-gray-400" />
                    {associatedMarket.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>


        <div className="flex flex-col items-end shrink-0 ml-1">
          <div className="flex items-center justify-end gap-1">
            <span className="text-gray-400 text-[9px] font-medium">{currency}</span>
            <input
              type="text"
              inputMode="decimal"
              value={displayPrice}
              onChange={(e) => handlePriceChange(e.target.value)}
              onBlur={handlePriceBlur}
              placeholder="0,00"
              className={`w-16 bg-transparent border-none text-right font-bold transition-colors focus:ring-0 p-0 outline-none ${
                item.isPurchased && item.isAvailable ? 'text-green-600' : 'text-gray-900'
              } ${textSizeClass}`}
            />
          </div>
          <div className="text-[9px] text-gray-400 mt-0.5 flex items-center gap-1">
            <span>Sub:</span>
            <span className="font-bold">
              {currency} {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">Excluir item?</h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Deseja remover <span className="font-semibold text-gray-800">"{item.name}"</span> da sua lista?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete();
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md shadow-red-200 hover:bg-red-700 active:scale-95 transition-all"
              >
                Excluir
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
            className="bg-white rounded-2xl p-4 max-w-xs w-full shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-xs">Escolher mercado</h4>
                  <p className="text-[10px] text-gray-400 truncate max-w-[170px]">{item.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMarketPicker(false)}
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 active:scale-90 transition-all"
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
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] ${
                          isSelected 
                            ? 'bg-indigo-50 text-indigo-900 border border-indigo-200 shadow-xs' 
                            : 'bg-gray-50/80 hover:bg-gray-100 text-gray-700 border border-transparent'
                        }`}
                      >
                        <span className="truncate">{market.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" strokeWidth={2.5} />}
                      </button>
                    );
                  })}

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => applyMarket(undefined, marketPickerStatus)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all active:scale-[0.98] ${
                        !item.marketId 
                          ? 'bg-gray-100 text-gray-800 font-bold border border-gray-200' 
                          : 'text-gray-500 hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <span>Sem mercado</span>
                      {!item.marketId && <Check className="w-3.5 h-3.5 text-gray-600 shrink-0" strokeWidth={2} />}
                    </button>
                  </div>
                </div>

                {/* Único seletor de Estado */}
                <div className="pt-3 mt-3 border-t border-gray-100">
                  <label htmlFor="item-status-select" className="block text-[11px] font-bold text-gray-500 mb-1.5">
                    Estado:
                  </label>

                  <div className="relative">
                    <select
                      id="item-status-select"
                      value={marketPickerStatus}
                      onChange={(e) => setMarketPickerStatus(e.target.value as 'pending' | 'purchased' | 'unavailable')}
                      className="w-full appearance-none bg-gray-50 hover:bg-gray-100/80 border border-gray-200 text-gray-800 text-xs font-bold py-2.5 pl-3.5 pr-9 rounded-xl outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                    >
                      <option value="pending">Para Comprar</option>
                      <option value="purchased">Comprado</option>
                      <option value="unavailable">Indisponível</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => applyMarket(item.marketId, marketPickerStatus)}
                    className="w-full mt-2.5 py-2 px-3 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-sm"
                  >
                    Confirmar
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-2">
                <p className="text-xs text-gray-500 font-medium mb-3">
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
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-sm"
                >
                  Configurar mercados
                </button>

                <div className="pt-3 mt-3 border-t border-gray-100">
                  <label htmlFor="item-status-select-empty" className="block text-[11px] font-bold text-gray-500 mb-1.5 text-left">
                    Estado:
                  </label>
                  <div className="relative">
                    <select
                      id="item-status-select-empty"
                      value={marketPickerStatus}
                      onChange={(e) => setMarketPickerStatus(e.target.value as 'pending' | 'purchased' | 'unavailable')}
                      className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold py-2.5 pl-3.5 pr-9 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="pending">Para Comprar</option>
                      <option value="purchased">Comprado</option>
                      <option value="unavailable">Indisponível</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => applyMarket(item.marketId, marketPickerStatus)}
                    className="w-full mt-2.5 py-2 px-3 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-sm"
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
