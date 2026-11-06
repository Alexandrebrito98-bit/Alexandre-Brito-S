import React, { useState, useEffect, useRef } from 'react';
import { ShoppingItem, Language } from '../types';
import { CategoryDefinition, getAllCategories, getCategoryDisplayName } from '../utils/categoryDetector';
import { AppThemeConfig } from '../utils/appThemes';
import { getTranslation } from '../i18n';
import { X, Check, Plus, ArrowLeft } from 'lucide-react';

interface CategoryPickerSheetProps {
  item: ShoppingItem;
  currentCategory: CategoryDefinition;
  customCategories: CategoryDefinition[];
  onSelectCategory: (category: CategoryDefinition) => void;
  onCreateCategory: (name: string, icon: string) => CategoryDefinition;
  onClose: () => void;
  themeConfig: AppThemeConfig;
  lang?: Language;
}

const QUICK_EMOJIS = ['🏷️', '📦', '🧴', '🐾', '👶', '🌿', '🥫', '☕', '🧁', '🍷'];

export const CategoryPickerSheet: React.FC<CategoryPickerSheetProps> = ({
  item,
  currentCategory,
  customCategories,
  onSelectCategory,
  onCreateCategory,
  onClose,
  themeConfig,
  lang = 'pt'
}) => {
  const currentLang: 'pt' | 'en' = lang === 'en' ? 'en' : 'pt';
  const t = getTranslation(currentLang);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🏷️');
  const inputRef = useRef<HTMLInputElement>(null);

  const categories = getAllCategories(customCategories);

  // Focus input when creating new category
  useEffect(() => {
    if (isCreatingNew) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isCreatingNew]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCreatingNew) {
          setIsCreatingNew(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreatingNew, onClose]);

  const handleSelect = (cat: CategoryDefinition) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(40);
      } catch (_) {}
    }
    onSelectCategory(cat);
    onClose();
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(40);
      } catch (_) {}
    }

    const created = onCreateCategory(trimmed, selectedEmoji);
    onSelectCategory(created);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: themeConfig.colors.background,
          color: themeConfig.colors.text
        }}
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden animate-in slide-in-from-bottom-6 duration-200 border-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle visual no topo para toque em celular */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden shrink-0">
          <div 
            style={{ backgroundColor: themeConfig.colors.textSecondary }}
            className="w-10 h-1 rounded-full opacity-30" 
          />
        </div>

        {/* Cabeçalho */}
        <div className="px-5 pt-3 pb-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex flex-col min-w-0">
            <span 
              style={{ color: themeConfig.colors.primary }}
              className="text-[11px] font-bold uppercase tracking-wider truncate"
            >
              {item.name}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold truncate">
              {isCreatingNew ? (lang === 'en' ? 'New Category' : 'Nova Categoria') : t.changeCategoryTitle}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isCreatingNew ? (
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                style={{
                  backgroundColor: themeConfig.colors.inputBg,
                  color: themeConfig.colors.text
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center border-0 cursor-pointer transition-all active:scale-95"
                aria-label="Voltar"
                title="Voltar"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: themeConfig.colors.inputBg,
                color: themeConfig.colors.textSecondary
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center border-0 cursor-pointer transition-all active:scale-95"
              aria-label="Fechar"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Conteúdo: Formulário de Nova Categoria OU Lista de Categorias */}
        {isCreatingNew ? (
          <form onSubmit={handleCreateNew} className="px-5 pb-6 pt-1 flex flex-col gap-4 overflow-y-auto">
            <div className="flex flex-col gap-1.5">
              <label 
                style={{ color: themeConfig.colors.textSecondary }}
                className="text-xs font-semibold"
              >
                {lang === 'en' ? 'Category Name' : 'Nome da categoria'}
              </label>
              <input
                ref={inputRef}
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder={t.newCategoryPlaceholder}
                style={{
                  backgroundColor: themeConfig.colors.inputBg,
                  color: themeConfig.colors.text
                }}
                className="w-full px-4 py-3 rounded-2xl text-sm font-medium border-0 outline-none transition-all placeholder:text-gray-400"
                maxLength={40}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label 
                style={{ color: themeConfig.colors.textSecondary }}
                className="text-xs font-semibold"
              >
                {lang === 'en' ? 'Choose Icon' : 'Escolha um ícone'}
              </label>
              <div className="flex flex-wrap gap-2">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    style={{
                      backgroundColor: selectedEmoji === emoji ? themeConfig.colors.primary : themeConfig.colors.inputBg,
                      color: selectedEmoji === emoji ? '#FFFFFF' : themeConfig.colors.text
                    }}
                    className="w-10 h-10 rounded-2xl text-lg flex items-center justify-center border-0 cursor-pointer transition-all active:scale-90"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                style={{
                  backgroundColor: themeConfig.colors.inputBg,
                  color: themeConfig.colors.textSecondary
                }}
                className="flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold border-0 cursor-pointer transition-all active:scale-95"
              >
                {lang === 'en' ? 'Cancel' : 'Cancelar'}
              </button>

              <button
                type="submit"
                disabled={!newCategoryName.trim()}
                style={{
                  backgroundColor: themeConfig.colors.primary,
                  color: '#FFFFFF',
                  opacity: newCategoryName.trim() ? 1 : 0.5
                }}
                className="flex-[1.5] py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold border-0 cursor-pointer transition-all active:scale-95 shadow-none"
              >
                {t.createCategoryBtn}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Botão de Nova Categoria no topo da lista */}
            <div className="px-5 pt-1 pb-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                style={{
                  backgroundColor: themeConfig.colors.inputBg,
                  color: themeConfig.colors.primary
                }}
                className="w-full py-2.5 px-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-98 border-0 cursor-pointer shadow-none"
              >
                <Plus className="w-4 h-4" strokeWidth={3} />
                <span>{t.newCategory}</span>
              </button>
            </div>

            {/* Lista com rolagem suave */}
            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-1 overscroll-contain">
              {categories.map((cat) => {
                const isSelected = cat.id === currentCategory.id;
                const displayName = getCategoryDisplayName(cat, currentLang);

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelect(cat)}
                    style={isSelected ? {
                      backgroundColor: themeConfig.colors.inputBg,
                      color: themeConfig.colors.primary
                    } : {
                      color: themeConfig.colors.text
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-2xl text-left flex items-center justify-between gap-3 transition-colors active:opacity-75 border-0 cursor-pointer ${
                      isSelected ? 'font-black' : 'font-medium hover:opacity-85'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0 leading-none" role="img" aria-hidden="true">
                        {cat.icon}
                      </span>
                      <span className="text-xs sm:text-sm truncate">
                        {displayName}
                      </span>
                    </div>

                    {isSelected && (
                      <div 
                        style={{ backgroundColor: themeConfig.colors.primary, color: '#FFFFFF' }}
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      >
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Espaçador inferior seguro para barras de navegação de celular */}
        <div className="h-2 shrink-0" />
      </div>
    </div>
  );
};
