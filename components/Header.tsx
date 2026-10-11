import React from 'react';
import { FilterStatus, Language } from '../types';
import { AppLogo } from './AppLogo';
import { getTranslation } from '../i18n';
import { AppThemeConfig } from '../utils/appThemes';

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
  themeConfig
}) => {
  const t = getTranslation(lang);
  const themeBlue = themeConfig?.colors.primary || primaryColor || '#2563eb';

  return (
    <header 
      style={themeConfig ? {
        backgroundColor: themeConfig.colors.card,
        borderColor: themeConfig.colors.border,
        color: themeConfig.colors.text
      } : undefined}
      className={`${!themeConfig && isDarkTheme ? 'bg-[#131b2e] border-white/10 text-white' : !themeConfig ? 'bg-white border-gray-100 text-gray-900' : ''} px-6 pt-6 pb-4 border-b flex flex-col gap-4 transition-colors`}
    >
      <div className="flex justify-between items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2 sm:gap-2.5 truncate min-w-0">
            <AppLogo className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl shadow-sm shrink-0" />
            <span 
              className="truncate leading-tight"
              style={themeConfig ? { color: themeConfig.colors.text } : undefined}
            >
              {isViewMode ? t.summary : t.appName}
            </span>
          </h1>
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
              style={{ backgroundColor: `${themeBlue}15`, color: themeBlue }}
              className="w-10 h-10 flex items-center justify-center rounded-xl active:scale-95 transition-all animate-in zoom-in duration-200"
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
            style={isViewMode ? { backgroundColor: themeBlue, color: themeConfig?.isDark ? '#0F172A' : '#FFFFFF' } : themeConfig ? { backgroundColor: themeConfig.isDark ? '#1E293B' : '#F3F4F6', color: themeConfig.colors.textSecondary } : undefined}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
              isViewMode ? 'text-white shadow-lg' : isDarkTheme ? 'bg-slate-800 text-slate-300' : 'bg-gray-50 text-gray-400'
            }`}
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
              backgroundColor: themeConfig.isDark ? '#450a0a' : '#fef2f2',
              color: '#dc2626'
            } : undefined}
            className={`w-10 h-10 flex items-center justify-center text-[#dc2626] rounded-xl transition-colors ${
              isDarkTheme ? 'bg-red-950/40 active:bg-red-900/40' : 'bg-red-50 active:bg-red-100'
            }`}
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
              backgroundColor: themeConfig.isDark ? '#1E293B' : '#F3F4F6',
              color: themeConfig.colors.textSecondary
            } : undefined}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
              isDarkTheme ? 'bg-slate-800 text-slate-300 active:bg-slate-700' : 'bg-gray-50 text-gray-400 active:bg-gray-100'
            }`}
            title={t.settingsTitle}
            aria-label={t.settingsTitle}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
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
                : (isDarkTheme ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-600')) : 'shadow-xs'
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
                : (isDarkTheme ? 'bg-slate-800 text-slate-300' : 'bg-blue-50 text-blue-700')) : 'shadow-xs'
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
              !themeConfig ? (currentFilter === 'purchased' ? 'bg-green-600 text-white shadow-md' : (isDarkTheme ? 'bg-slate-800 text-slate-300' : 'bg-green-100 text-green-700')) : 'shadow-xs'
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
              !themeConfig ? (currentFilter === 'unavailable' ? 'bg-amber-600 text-white shadow-md' : (isDarkTheme ? 'bg-slate-800 text-slate-300' : 'bg-amber-100 text-amber-700')) : 'shadow-xs'
            }`}
          >
            {t.filterUnavailable}: {unavailableCount}
          </button>
        </div>
      )}
    </header>
  );
};
