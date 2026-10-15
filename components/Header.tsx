import React from 'react';
import { FilterStatus, Language } from '../types';
import { AppLogo } from './AppLogo';
import { getTranslation } from '../i18n';
import { AppThemeConfig } from '../utils/appThemes';
import { ChevronDown, User, LogOut } from 'lucide-react';

interface HeaderProps {
  itemCount: number;
  availableCount: number;
  purchasedCount: number;
  unavailableCount: number;
  onOpenSettings: () => void;
  onClearList: () => void;
  isViewMode: boolean;
  onToggleViewMode: () => void;
  onExport?: () => void;
  currentFilter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
  lang?: Language;
  primaryColor?: string;
  isDarkTheme?: boolean;
  themeConfig?: AppThemeConfig;
  activeListName?: string;
  activeListIcon?: string;
  onOpenListMenu?: () => void;
  userName?: string;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  itemCount, 
  availableCount, 
  purchasedCount,
  unavailableCount,
  onOpenSettings, 
  onClearList,
  isViewMode,
  onToggleViewMode,
  onExport,
  currentFilter,
  onFilterChange,
  lang = 'pt',
  primaryColor,
  isDarkTheme = false,
  themeConfig,
  activeListName,
  activeListIcon,
  onOpenListMenu,
  userName,
  onSignOut
}) => {
  const t = getTranslation(lang);
  const themeBlue = themeConfig?.colors.primary || primaryColor || '#2563eb';

  return (
    <header 
      style={themeConfig ? {
        backgroundColor: themeConfig.colors.background,
        color: themeConfig.colors.text
      } : undefined}
      className="px-6 pt-6 pb-3 flex flex-col gap-4 transition-colors"
    >
      <div className="flex justify-between items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2 sm:gap-2.5 truncate shrink-0">
              <AppLogo 
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl shrink-0" 
                backgroundColor={themeConfig ? themeConfig.colors.primary : undefined}
              />
              <span 
                className={`truncate leading-tight ${isViewMode ? 'uppercase tracking-wider font-extrabold' : ''}`}
                style={themeConfig ? { color: isViewMode ? themeConfig.colors.primary : themeConfig.colors.text } : undefined}
              >
                {isViewMode ? t.summary : t.appName}
              </span>
            </h1>

            {/* Nome da lista ativa com ícone de troca ao lado do título */}
            {!isViewMode && activeListName && onOpenListMenu && (
              <button
                type="button"
                onClick={onOpenListMenu}
                style={{
                  backgroundColor: themeConfig ? themeConfig.colors.inputBg : '#F3F4F6',
                  color: themeConfig ? themeConfig.colors.text : '#111827'
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 max-w-[170px] sm:max-w-[220px] border-0 shrink-0 cursor-pointer shadow-none"
                title={`${t.switchList}: ${activeListName}`}
                aria-label={`${t.switchList}: ${activeListName}`}
              >
                {activeListIcon && (
                  <span className="text-sm shrink-0 leading-none">{activeListIcon}</span>
                )}
                <span className="truncate">{activeListName}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
              </button>
            )}

            {/* Nome do usuário autenticado */}
            {userName && (
              <div 
                style={{
                  backgroundColor: themeConfig ? themeConfig.colors.inputBg : '#F3F4F6',
                  color: themeConfig ? themeConfig.colors.textSecondary : '#4B5563'
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold max-w-[140px] sm:max-w-[180px] shrink-0 border-0"
                title={`Conectado como ${userName}`}
              >
                <User className="w-3.5 h-3.5 opacity-60 shrink-0" />
                <span className="truncate text-[11px]">{userName}</span>
              </div>
            )}
          </div>
          {!isViewMode && (
            <p 
              className="text-xs sm:text-sm font-medium truncate mt-0.5"
              style={{ color: themeConfig ? themeConfig.colors.textSecondary : undefined }}
            >
              {t.quickControl}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isViewMode && (
            <button 
              onClick={onExport}
              style={{ backgroundColor: themeConfig ? themeConfig.colors.inputBg : `${themeBlue}15`, color: themeBlue }}
              className="w-10 h-10 flex items-center justify-center rounded-xl active:scale-95 transition-all"
              aria-label={t.exportList}
              title={t.exportList}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          )}

          <button 
            onClick={onToggleViewMode}
            style={isViewMode ? { backgroundColor: themeBlue, color: '#FFFFFF' } : themeConfig ? { backgroundColor: themeConfig.colors.inputBg, color: themeConfig.colors.textSecondary } : undefined}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95"
            title={t.viewMode}
            aria-label={t.viewMode}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>

          <button 
            onClick={onClearList}
            style={themeConfig ? {
              backgroundColor: themeConfig.colors.deleteBg,
              color: themeConfig.colors.deleteText
            } : {
              backgroundColor: '#FEE2E2',
              color: '#DC2626'
            }}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95"
            title={t.clearList}
            aria-label={t.clearList}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          
          <button 
            onClick={onOpenSettings}
            style={themeConfig ? {
              backgroundColor: themeConfig.colors.inputBg,
              color: themeConfig.colors.textSecondary
            } : undefined}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95"
            title={t.settingsTitle}
            aria-label={t.settingsTitle}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Botão Sair discreto */}
          {onSignOut && (
            <button
              onClick={onSignOut}
              style={themeConfig ? {
                backgroundColor: themeConfig.colors.inputBg,
                color: themeConfig.colors.textSecondary
              } : undefined}
              className="w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95 border-0 hover:text-red-500 cursor-pointer"
              title="Sair da conta"
              aria-label="Sair da conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {isViewMode && (
        <div className="flex overflow-x-auto no-scrollbar gap-2 -mx-2 px-2 pb-1 animate-in fade-in duration-200">
          {/* Chip Todos */}
          <button 
            onClick={() => onFilterChange('all')}
            style={themeConfig ? (currentFilter === 'all' ? {
              backgroundColor: themeConfig.colors.chipAllBg,
              color: themeConfig.colors.chipAllText
            } : {
              backgroundColor: themeConfig.isDark ? '#1E293B' : '#F3F4F6',
              color: themeConfig.colors.textSecondary
            }) : undefined}
            className={`whitespace-nowrap px-2.5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-tight transition-all shrink-0 ${
              !themeConfig ? (currentFilter === 'all' 
                ? (isDarkTheme ? 'bg-white text-slate-900 shadow-md' : 'bg-gray-900 text-white shadow-md')
                : (isDarkTheme ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-600')) : 'shadow-none'
            }`}
          >
            {t.filterAll}: {itemCount}
          </button>

          {/* Chip Disponíveis / Para Comprar */}
          <button 
            onClick={() => onFilterChange('pending')}
            style={themeConfig ? (currentFilter === 'pending' ? {
              backgroundColor: themeConfig.colors.primary,
              color: themeConfig.isDark ? '#0F172A' : '#FFFFFF'
            } : {
              backgroundColor: themeConfig.colors.chipAvailableBg,
              color: themeConfig.colors.chipAvailableText
            }) : (currentFilter === 'pending' ? { backgroundColor: themeBlue } : undefined)}
            className={`whitespace-nowrap px-2.5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-tight transition-all shrink-0 ${
              !themeConfig ? (currentFilter === 'pending' 
                ? 'text-white shadow-md' 
                : (isDarkTheme ? 'bg-slate-800 text-slate-300' : 'bg-blue-50 text-blue-700')) : 'shadow-none'
            }`}
          >
            {t.filterAvailable}: {availableCount}
          </button>

          {/* Chip Comprados */}
          <button 
            onClick={() => onFilterChange('purchased')}
            style={themeConfig ? (currentFilter === 'purchased' ? {
              backgroundColor: themeConfig.colors.primaryHover || themeConfig.colors.primary,
              color: '#FFFFFF'
            } : {
              backgroundColor: themeConfig.colors.chipPurchasedBg,
              color: themeConfig.colors.chipPurchasedText
            }) : undefined}
            className={`whitespace-nowrap px-2.5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-tight transition-all shrink-0 ${
              !themeConfig ? (currentFilter === 'purchased' ? 'bg-green-600 text-white shadow-md' : (isDarkTheme ? 'bg-slate-800 text-slate-300' : 'bg-green-100 text-green-700')) : 'shadow-none'
            }`}
          >
            {t.filterPurchased}: {purchasedCount}
          </button>

          {/* Chip Indisponíveis */}
          <button 
            onClick={() => onFilterChange('unavailable')}
            style={themeConfig ? (currentFilter === 'unavailable' ? {
              backgroundColor: themeConfig.colors.accent,
              color: '#FFFFFF'
            } : {
              backgroundColor: themeConfig.colors.chipUnavailableBg,
              color: themeConfig.colors.chipUnavailableText
            }) : undefined}
            className={`whitespace-nowrap px-2.5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-tight transition-all shrink-0 ${
              !themeConfig ? (currentFilter === 'unavailable' ? 'bg-amber-600 text-white shadow-md' : (isDarkTheme ? 'bg-slate-800 text-slate-300' : 'bg-amber-100 text-amber-700')) : 'shadow-none'
            }`}
          >
            {t.filterUnavailable}: {unavailableCount}
          </button>
        </div>
      )}
    </header>
  );
};
