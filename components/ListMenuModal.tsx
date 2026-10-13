import React, { useState, useRef } from 'react';
import { ShoppingList, Language } from '../types';
import { getTranslation } from '../i18n';
import { AppThemeConfig } from '../utils/appThemes';
import { 
  X, 
  Plus, 
  Check, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  ShoppingBag, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';

interface ListMenuModalProps {
  lists: ShoppingList[];
  activeListId: string;
  onSelectList: (id: string) => void;
  onCreateList: (name: string, icon?: string) => void;
  onRenameList: (id: string, name: string, icon?: string) => void;
  onDeleteList: (id: string) => void;
  onClose: () => void;
  themeConfig: AppThemeConfig;
  lang?: Language;
}

const PRESET_ICONS = ['🛒', '💊', '🏠', '🍏', '🥩', '🥖', '🛍️', '🐾', '🧹', '🍷', '📦', '⚡'];

export const ListMenuModal: React.FC<ListMenuModalProps> = ({
  lists,
  activeListId,
  onSelectList,
  onCreateList,
  onRenameList,
  onDeleteList,
  onClose,
  themeConfig,
  lang = 'pt'
}) => {
  const t = getTranslation(lang);

  // States
  const [viewState, setViewState] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedListForAction, setSelectedListForAction] = useState<ShoppingList | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form states for Create & Edit
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState<string>('🛒');
  const [actionMenuTargetId, setActionMenuTargetId] = useState<string | null>(null);

  // Long press handling
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isLongPressTriggeredRef = useRef(false);

  const startLongPress = (list: ShoppingList, clientX?: number, clientY?: number) => {
    isLongPressTriggeredRef.current = false;
    if (clientX !== undefined && clientY !== undefined) {
      touchStartPosRef.current = { x: clientX, y: clientY };
    }
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      setSelectedListForAction(list);
      setActionMenuTargetId(prev => prev === list.id ? null : list.id);
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      cancelLongPress();
    }
  };

  const handleOpenCreate = () => {
    setFormName('');
    setFormIcon('🛒');
    setViewState('create');
  };

  const handleOpenEdit = (list: ShoppingList) => {
    setSelectedListForAction(list);
    setFormName(list.name);
    setFormIcon(list.icon || '🛒');
    setActionMenuTargetId(null);
    setViewState('edit');
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = formName.trim();
    if (!trimmed) return;
    onCreateList(trimmed, formIcon || undefined);
    onClose();
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = formName.trim();
    if (!trimmed || !selectedListForAction) return;
    onRenameList(selectedListForAction.id, trimmed, formIcon || undefined);
    setViewState('list');
    setSelectedListForAction(null);
  };

  const handleDeleteTrigger = (list: ShoppingList) => {
    setSelectedListForAction(list);
    setActionMenuTargetId(null);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedListForAction) return;
    onDeleteList(selectedListForAction.id);
    setShowDeleteConfirm(false);
    setSelectedListForAction(null);
    setActionMenuTargetId(null);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Main Container */}
      <div 
        style={{
          backgroundColor: themeConfig.colors.card,
          color: themeConfig.colors.text
        }}
        className="relative w-full max-w-sm sm:max-w-md rounded-t-[2.2rem] sm:rounded-[2.2rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 border-0 flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-2 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div 
              style={{
                backgroundColor: themeConfig.colors.inputBg,
                color: themeConfig.colors.primary
              }}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            >
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight" style={{ color: themeConfig.colors.text }}>
                {viewState === 'create' 
                  ? t.newList 
                  : viewState === 'edit' 
                    ? t.renameList 
                    : t.myLists}
              </h2>
              <p className="text-[11px] font-medium" style={{ color: themeConfig.colors.textSecondary }}>
                {viewState === 'list' ? t.holdToManageList : t.quickControl}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={viewState === 'list' ? onClose : () => setViewState('list')}
            style={{
              backgroundColor: themeConfig.colors.inputBg,
              color: themeConfig.colors.textSecondary
            }}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-95 shrink-0 border-0 cursor-pointer"
            aria-label={t.close}
            title={t.close}
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* View: List of lists */}
        {viewState === 'list' && (
          <div className="flex flex-col min-h-0 flex-1">
            <div className="space-y-2 overflow-y-auto max-h-[50vh] pr-1 py-1 custom-scrollbar">
              {lists.map((list) => {
                const isActive = list.id === activeListId;
                const isActionOpen = actionMenuTargetId === list.id;
                const itemsCount = list.items?.length || 0;
                const availableCount = list.items?.filter(i => i.isAvailable && !i.isPurchased).length || 0;

                return (
                  <div
                    key={list.id}
                    className="relative flex flex-col"
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (!isLongPressTriggeredRef.current) {
                          onSelectList(list.id);
                          onClose();
                        }
                        setTimeout(() => {
                          isLongPressTriggeredRef.current = false;
                        }, 120);
                      }}
                      onTouchStart={(e) => {
                        const touch = e.touches[0];
                        startLongPress(list, touch.clientX, touch.clientY);
                      }}
                      onTouchEnd={cancelLongPress}
                      onTouchCancel={cancelLongPress}
                      onTouchMove={handleTouchMove}
                      onMouseDown={() => startLongPress(list)}
                      onMouseUp={cancelLongPress}
                      onMouseLeave={cancelLongPress}
                      style={isActive ? {
                        backgroundColor: themeConfig.colors.inputBg,
                        borderColor: themeConfig.colors.primary,
                      } : {
                        backgroundColor: themeConfig.colors.inputBg,
                        borderColor: 'transparent',
                        opacity: 0.95
                      }}
                      className={`w-full p-3.5 rounded-2xl flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer select-none border-2 ${
                        isActive ? 'border-solid' : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Ícone da lista */}
                        <div 
                          style={{
                            backgroundColor: isActive ? themeConfig.colors.primary : `${themeConfig.colors.primary}18`,
                            color: isActive ? '#FFFFFF' : themeConfig.colors.primary
                          }}
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-colors"
                        >
                          {list.icon || '🛒'}
                        </div>

                        {/* Nome e contadores */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span 
                              style={{ 
                                color: isActive ? themeConfig.colors.primary : themeConfig.colors.text,
                                fontWeight: isActive ? 800 : 700 
                              }}
                              className="text-sm truncate block"
                            >
                              {list.name}
                            </span>
                            {isActive && (
                              <span 
                                style={{
                                  backgroundColor: themeConfig.colors.primary,
                                  color: '#FFFFFF'
                                }}
                                className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md shrink-0"
                              >
                                {t.activeList}
                              </span>
                            )}
                          </div>
                          <span 
                            style={{ color: themeConfig.colors.textSecondary }}
                            className="text-[11px] font-medium block truncate mt-0.5"
                          >
                            {itemsCount === 0 ? 'Vazia' : `${availableCount} para comprar • ${itemsCount} total`}
                          </span>
                        </div>
                      </div>

                      {/* Botões do card: Check ativo + 3 pontos para abrir ações */}
                      <div className="flex items-center gap-1 shrink-0">
                        {isActive && (
                          <div 
                            style={{ color: themeConfig.colors.primary }}
                            className="w-6 h-6 flex items-center justify-center shrink-0"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedListForAction(list);
                            setActionMenuTargetId(isActionOpen ? null : list.id);
                          }}
                          style={{
                            backgroundColor: isActionOpen 
                              ? (themeConfig.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)')
                              : 'transparent',
                            color: isActionOpen
                              ? themeConfig.colors.primary
                              : themeConfig.colors.textSecondary
                          }}
                          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-90 transition-all cursor-pointer border-0 shrink-0"
                          title="Opções da lista"
                          aria-label="Opções da lista"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Barra de ações rápida logo abaixo do card com Renomear e Excluir */}
                    {isActionOpen && (
                      <div 
                        style={{
                          backgroundColor: themeConfig.colors.inputBg,
                        }}
                        className="mt-1.5 p-2 rounded-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150 border border-black/5 dark:border-white/5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(list)}
                          style={{
                            backgroundColor: themeConfig.colors.card,
                            color: themeConfig.colors.text,
                          }}
                          className="flex-1 min-h-[44px] h-[44px] px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-black/5 dark:border-white/5 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer select-none"
                          aria-label={`${t.renameList}: ${list.name}`}
                        >
                          <Pencil className="w-4 h-4 opacity-80 shrink-0" style={{ color: themeConfig.colors.primary }} />
                          <span>{t.renameList}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTrigger(list)}
                          style={{
                            backgroundColor: themeConfig.colors.deleteBg,
                            color: themeConfig.colors.deleteText,
                            borderColor: 'rgba(220, 38, 38, 0.25)'
                          }}
                          className="flex-1 min-h-[44px] h-[44px] px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-solid shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer select-none"
                          aria-label={`${t.deleteList}: ${list.name}`}
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                          <span>{t.deleteList}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Botão Nova Lista */}
            <div className="pt-4 mt-2 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={handleOpenCreate}
                style={{
                  backgroundColor: themeConfig.colors.primary,
                  color: '#FFFFFF'
                }}
                className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-none transition-transform active:scale-95 border-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{t.newList}</span>
              </button>
            </div>
          </div>
        )}

        {/* View: Criar Nova Lista */}
        {viewState === 'create' && (
          <form onSubmit={handleSaveCreate} className="space-y-4 pt-1">
            <div>
              <label 
                style={{ color: themeConfig.colors.primary }}
                className="text-[11px] font-bold uppercase tracking-wider block mb-1.5"
              >
                {t.listNamePlaceholder}
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
                placeholder="Ex.: Supermercado, Farmácia, Casa..."
                style={{
                  backgroundColor: themeConfig.colors.inputBg,
                  color: themeConfig.colors.text
                }}
                className="w-full px-4 py-3 rounded-2xl border-0 outline-none font-semibold text-sm transition-all"
              />
            </div>

            {/* Seletor de Ícones */}
            <div>
              <label 
                style={{ color: themeConfig.colors.textSecondary }}
                className="text-[11px] font-bold uppercase tracking-wider block mb-2"
              >
                {t.listIcon}
              </label>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormIcon(emoji)}
                    style={formIcon === emoji ? {
                      backgroundColor: themeConfig.colors.primary,
                      borderColor: themeConfig.colors.primary
                    } : {
                      backgroundColor: themeConfig.colors.inputBg,
                      borderColor: 'transparent'
                    }}
                    className={`h-11 rounded-xl text-xl flex items-center justify-center transition-all active:scale-90 border-2 cursor-pointer ${
                      formIcon === emoji ? 'shadow-sm' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setViewState('list')}
                style={{
                  backgroundColor: themeConfig.colors.inputBg,
                  color: themeConfig.colors.textSecondary
                }}
                className="flex-1 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider border-0 cursor-pointer active:scale-95 transition-transform"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={!formName.trim()}
                style={{
                  backgroundColor: formName.trim() ? themeConfig.colors.primary : `${themeConfig.colors.primary}50`,
                  color: '#FFFFFF'
                }}
                className="flex-1 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider border-0 cursor-pointer active:scale-95 transition-transform"
              >
                {t.createList}
              </button>
            </div>
          </form>
        )}

        {/* View: Renomear Lista */}
        {viewState === 'edit' && selectedListForAction && (
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-1">
            <div>
              <label 
                style={{ color: themeConfig.colors.primary }}
                className="text-[11px] font-bold uppercase tracking-wider block mb-1.5"
              >
                {t.renameList}
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
                placeholder="Ex.: Supermercado, Farmácia..."
                style={{
                  backgroundColor: themeConfig.colors.inputBg,
                  color: themeConfig.colors.text
                }}
                className="w-full px-4 py-3 rounded-2xl border-0 outline-none font-semibold text-sm transition-all"
              />
            </div>

            {/* Seletor de Ícones */}
            <div>
              <label 
                style={{ color: themeConfig.colors.textSecondary }}
                className="text-[11px] font-bold uppercase tracking-wider block mb-2"
              >
                {t.listIcon}
              </label>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormIcon(emoji)}
                    style={formIcon === emoji ? {
                      backgroundColor: themeConfig.colors.primary,
                      borderColor: themeConfig.colors.primary
                    } : {
                      backgroundColor: themeConfig.colors.inputBg,
                      borderColor: 'transparent'
                    }}
                    className={`h-11 rounded-xl text-xl flex items-center justify-center transition-all active:scale-90 border-2 cursor-pointer ${
                      formIcon === emoji ? 'shadow-sm' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setViewState('list')}
                style={{
                  backgroundColor: themeConfig.colors.inputBg,
                  color: themeConfig.colors.textSecondary
                }}
                className="flex-1 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider border-0 cursor-pointer active:scale-95 transition-transform"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={!formName.trim()}
                style={{
                  backgroundColor: formName.trim() ? themeConfig.colors.primary : `${themeConfig.colors.primary}50`,
                  color: '#FFFFFF'
                }}
                className="flex-1 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider border-0 cursor-pointer active:scale-95 transition-transform"
              >
                {t.save}
              </button>
            </div>
          </form>
        )}

        {/* Modal de Confirmação de Exclusão */}
        {showDeleteConfirm && selectedListForAction && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-in fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
            <div 
              style={{
                backgroundColor: themeConfig.colors.card,
                color: themeConfig.colors.text
              }}
              className="relative w-full max-w-xs rounded-3xl p-6 shadow-2xl border-0 text-center animate-in zoom-in-95 duration-150"
            >
              <div 
                style={{
                  backgroundColor: themeConfig.colors.deleteBg,
                  color: themeConfig.colors.deleteText
                }}
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              >
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h3 className="text-base font-bold mb-1.5" style={{ color: themeConfig.colors.text }}>
                {t.deleteList}
              </h3>

              {lists.length <= 1 ? (
                <>
                  <p className="text-xs font-medium mb-5" style={{ color: themeConfig.colors.textSecondary }}>
                    {t.cannotDeleteOnlyList}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      backgroundColor: themeConfig.colors.primary,
                      color: '#FFFFFF'
                    }}
                    className="w-full min-h-[44px] h-[44px] py-3 rounded-xl font-bold text-xs uppercase tracking-wider border-0 cursor-pointer active:scale-95 transition-transform"
                  >
                    Entendido
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs font-medium mb-5" style={{ color: themeConfig.colors.textSecondary }}>
                    {t.deleteListConfirm(selectedListForAction.name)}
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      style={{
                        backgroundColor: themeConfig.colors.inputBg,
                        color: themeConfig.colors.textSecondary
                      }}
                      className="flex-1 min-h-[44px] h-[44px] py-3 rounded-xl font-bold text-xs uppercase tracking-wider border-0 cursor-pointer active:scale-95 transition-transform"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      style={{
                        backgroundColor: themeConfig.colors.deleteBg,
                        color: themeConfig.colors.deleteText,
                        borderColor: 'rgba(220, 38, 38, 0.25)'
                      }}
                      className="flex-1 min-h-[44px] h-[44px] py-3 rounded-xl font-bold text-xs uppercase tracking-wider border border-solid cursor-pointer active:scale-95 transition-transform shadow-sm"
                    >
                      {t.deleteList}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
