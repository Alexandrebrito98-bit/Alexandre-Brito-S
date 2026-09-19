
import React from 'react';
import { FilterStatus } from '../types';

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
  onFilterChange
}) => {
  return (
    <header className="bg-white px-6 pt-6 pb-4 border-b border-gray-100 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Minha Lista
          </h1>
          <p className="text-gray-400 text-sm">
            {isViewMode ? 'Modo Visualização' : 'Controle rápido'}
          </p>
        </div>
        <div className="flex gap-2">
          {isViewMode && (
            <button 
              onClick={onExport}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 active:scale-95 transition-all animate-in zoom-in duration-200"
              aria-label="Exportar Lista"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          )}

          <button 
            onClick={onToggleViewMode}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
              isViewMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-50 text-gray-400'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>

          <button 
            onClick={onClearList}
            className="w-10 h-10 flex items-center justify-center text-[#dc2626] rounded-xl bg-red-50 active:bg-red-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          
          <button 
            onClick={onOpenSettings}
            className="w-10 h-10 flex items-center justify-center text-gray-400 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex overflow-x-auto no-scrollbar gap-2 -mx-2 px-2 pb-1">
        <button 
          onClick={() => onFilterChange('all')}
          className={`whitespace-nowrap px-2.5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-tight transition-all shrink-0 ${
            currentFilter === 'all' ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Itens: {itemCount}
        </button>
        <button 
          onClick={() => onFilterChange('pending')}
          className={`whitespace-nowrap px-2.5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-tight transition-all shrink-0 ${
            currentFilter === 'pending' ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-100 text-blue-700'
          }`}
        >
          Disponíveis: {availableCount}
        </button>
        <button 
          onClick={() => onFilterChange('purchased')}
          className={`whitespace-nowrap px-2.5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-tight transition-all shrink-0 ${
            currentFilter === 'purchased' ? 'bg-green-600 text-white shadow-md' : 'bg-green-100 text-green-700'
          }`}
        >
          Comprados: {purchasedCount}
        </button>
        <button 
          onClick={() => onFilterChange('unavailable')}
          className={`whitespace-nowrap px-2.5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-tight transition-all shrink-0 ${
            currentFilter === 'unavailable' ? 'bg-amber-600 text-white shadow-md' : 'bg-amber-100 text-amber-700'
          }`}
        >
          Indisponíveis: {unavailableCount}
        </button>
      </div>
    </header>
  );
};
