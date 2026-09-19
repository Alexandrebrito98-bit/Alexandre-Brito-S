
import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, SavedList, Market, SwipeAction } from '../types';
import { X, Store, Edit2, Trash2, Check } from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdate: (s: AppSettings) => void;
  onClose: () => void;
  initialSection?: 'general' | 'markets';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  settings, 
  onUpdate, 
  onClose,
  initialSection = 'general'
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>({
    ...settings,
    markets: settings.markets || [],
    isOrganizeByMarketEnabled: settings.isOrganizeByMarketEnabled || false,
  });
  const [displayBudget, setDisplayBudget] = useState(
    settings.budgetLimit === 0 ? '' : settings.budgetLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
  const [viewingHistory, setViewingHistory] = useState<SavedList | null>(null);
  
  // Estados para gerenciamento de mercados
  const [newMarketName, setNewMarketName] = useState('');
  const [editingMarketId, setEditingMarketId] = useState<string | null>(null);
  const [editingMarketName, setEditingMarketName] = useState('');
  const marketsSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialSection === 'markets' && marketsSectionRef.current) {
      setTimeout(() => {
        marketsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 250);
    }
  }, [initialSection]);

  useEffect(() => {
    const formatted = localSettings.budgetLimit === 0 ? '' : localSettings.budgetLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const currentNumeric = parseFloat(displayBudget.replace(',', '.'));
    const isSameValue = isNaN(currentNumeric) ? localSettings.budgetLimit === 0 : currentNumeric === localSettings.budgetLimit;
    
    if (!isSameValue) {
      setDisplayBudget(formatted);
    }
  }, [localSettings.budgetLimit]);

  useEffect(() => {
    setLocalSettings({
      ...settings,
      markets: settings.markets || [],
      isOrganizeByMarketEnabled: settings.isOrganizeByMarketEnabled || false,
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

  const handleAddMarket = () => {
    const trimmed = newMarketName.trim();
    if (!trimmed) return;
    const exists = (localSettings.markets || []).some(m => m.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setNewMarketName('');
      return;
    }
    const newMarket: Market = { id: crypto.randomUUID(), name: trimmed };
    const updatedMarkets = [...(localSettings.markets || []), newMarket];
    const updated: AppSettings = { ...localSettings, markets: updatedMarkets };
    setLocalSettings(updated);
    onUpdate(updated);
    setNewMarketName('');
  };

  const handleSaveEditMarket = (id: string) => {
    const trimmed = editingMarketName.trim();
    if (!trimmed) return;
    const updatedMarkets = (localSettings.markets || []).map(m => m.id === id ? { ...m, name: trimmed } : m);
    const updated: AppSettings = { ...localSettings, markets: updatedMarkets };
    setLocalSettings(updated);
    onUpdate(updated);
    setEditingMarketId(null);
    setEditingMarketName('');
  };

  const handleDeleteMarket = (id: string) => {
    const updatedMarkets = (localSettings.markets || []).filter(m => m.id !== id);
    const updated: AppSettings = { ...localSettings, markets: updatedMarkets };
    setLocalSettings(updated);
    onUpdate(updated);
  };

  const handleConfirm = () => {
    onUpdate(localSettings);
    onClose();
  };

  const swipeOptions: { val: SwipeAction; label: string }[] = [
    { val: 'purchase', label: 'Comprar' },
    { val: 'unavailable', label: 'Indisp.' },
    { val: 'delete', label: 'Excluir' },
    ...(localSettings.isOrganizeByMarketEnabled ? [{ val: 'market' as SwipeAction, label: 'Mercado' }] : []),
    { val: 'none', label: 'Nenhum' }
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
                  aria-label="Voltar para configurações"
                  title="Voltar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 leading-tight truncate">
                    {new Date(viewingHistory.date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).charAt(0).toUpperCase() + new Date(viewingHistory.date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).slice(1)}
                  </h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Detalhes da Compra</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors active:scale-95 shrink-0 ml-2"
                aria-label="Fechar"
                title="Fechar"
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {viewingHistory.items.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-gray-800 truncate">{item.name}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{item.quantity} un • {localSettings.currency} {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <span className="text-xs font-black text-blue-600 shrink-0">
                    {localSettings.currency} {(item.unitPrice * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total da Lista</span>
              <span className="text-lg font-black text-gray-900">{localSettings.currency} {viewingHistory.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Configurações</h2>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors active:scale-95 shrink-0"
                aria-label="Fechar sem salvar alterações"
                title="Fechar"
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="space-y-8 overflow-y-auto max-h-[70vh] pb-4 custom-scrollbar">
          {/* Currency Selection Section */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-4">Moeda Preferencial</label>
            <div className="flex gap-3">
              {currencies.map(curr => (
                <button
                  key={curr}
                  onClick={() => setLocalSettings(prev => ({ ...prev, currency: curr }))}
                  className={`flex-1 py-3 rounded-2xl border-2 transition-all font-bold ${
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
            {/* Budget Mode Toggle */}
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-tight block">Modo Orçamento</label>
                  <p className="text-[10px] text-gray-400 font-medium">Controle seus gastos totais</p>
                </div>
                <button 
                  onClick={() => setLocalSettings(prev => ({ ...prev, isBudgetModeActive: !prev.isBudgetModeActive }))}
                  className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${localSettings.isBudgetModeActive ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform transform ${localSettings.isBudgetModeActive ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
              
              {localSettings.isBudgetModeActive && (
                <div className="mt-4 animate-in slide-in-from-top duration-200">
                  <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Valor Máximo</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">{localSettings.currency}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={displayBudget}
                      onChange={(e) => handleBudgetChange(e.target.value)}
                      onBlur={() => {
                        if (localSettings.budgetLimit !== 0) {
                          setDisplayBudget(localSettings.budgetLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                        } else {
                          setDisplayBudget('');
                        }
                      }}
                      placeholder="0,00"
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
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-tight block">Gestos de Deslizar</label>
                  <p className="text-[10px] text-gray-400 font-medium">Ações rápidas ao arrastar itens</p>
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
                    <label className="text-[10px] text-gray-400 font-bold uppercase block mb-2">Arrastar para Direita (→)</label>
                    <div className={`grid ${localSettings.isOrganizeByMarketEnabled ? 'grid-cols-5' : 'grid-cols-4'} gap-1.5`}>
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
                    <label className="text-[10px] text-gray-400 font-bold uppercase block mb-2">Arrastar para Esquerda (←)</label>
                    <div className={`grid ${localSettings.isOrganizeByMarketEnabled ? 'grid-cols-5' : 'grid-cols-4'} gap-1.5`}>
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

          {/* Markets Section */}
          <div ref={marketsSectionRef} id="settings-markets-section" className="space-y-4">
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-tight block">Organizar produtos por mercado</label>
                  <p className="text-[10px] text-gray-400 font-medium">Associe produtos a mercados específicos</p>
                </div>
                <button 
                  onClick={() => {
                    const updated = { ...localSettings, isOrganizeByMarketEnabled: !localSettings.isOrganizeByMarketEnabled };
                    setLocalSettings(updated);
                    onUpdate(updated);
                  }}
                  className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${localSettings.isOrganizeByMarketEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform transform ${localSettings.isOrganizeByMarketEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Área de Mercados */}
              <div className="mt-4 pt-4 border-t border-gray-200/60">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Mercados Cadastrados</span>
                  </div>
                  <span className="text-[10px] bg-gray-200/70 text-gray-600 font-bold px-2 py-0.5 rounded-full">
                    {(localSettings.markets || []).length}
                  </span>
                </div>

                {/* Adicionar mercado */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newMarketName}
                    onChange={(e) => setNewMarketName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddMarket()}
                    placeholder="Ex: Continente, Lidl, Auchan..."
                    className="flex-1 px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  />
                  <button
                    type="button"
                    onClick={handleAddMarket}
                    disabled={!newMarketName.trim()}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Lista de Mercados cadastrados */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {(localSettings.markets || []).length > 0 ? (
                    localSettings.markets.map(market => (
                      <div 
                        key={market.id} 
                        className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-100 shadow-2xs group"
                      >
                        {editingMarketId === market.id ? (
                          <div className="flex items-center gap-2 flex-1 mr-2">
                            <input
                              type="text"
                              value={editingMarketName}
                              onChange={(e) => setEditingMarketName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveEditMarket(market.id)}
                              autoFocus
                              className="flex-1 px-2 py-1 text-xs font-bold bg-blue-50 border border-blue-200 rounded-lg outline-none text-gray-800"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditMarket(market.id)}
                              className="p-1 bg-green-500 text-white rounded-lg active:scale-90 transition-transform"
                              title="Salvar"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingMarketId(null)}
                              className="p-1 bg-gray-100 text-gray-500 rounded-lg active:scale-90 transition-transform"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                              <span className="text-xs font-bold text-gray-800 truncate">{market.name}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMarketId(market.id);
                                  setEditingMarketName(market.name);
                                }}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg active:scale-90 transition-all"
                                title="Editar nome"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMarket(market.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg active:scale-90 transition-all"
                                title="Excluir mercado"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 bg-white/60 rounded-xl border border-dashed border-gray-200">
                      <p className="text-[11px] text-gray-400 font-medium">Nenhum mercado cadastrado.</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Cadastre acima os mercados que você costuma frequentar.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>


          {/* History Section */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-4">Histórico de Compras</label>
            <div className="space-y-3">
              {localSettings.savedHistory && localSettings.savedHistory.length > 0 ? (
                localSettings.savedHistory.map(history => (
                  <div key={history.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center group">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {new Date(history.date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).charAt(0).toUpperCase() + new Date(history.date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).slice(1)}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium">
                        {new Date(history.date).toLocaleDateString('pt-BR')} • {history.totalItems} itens
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-gray-700">
                        {localSettings.currency} {history.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setViewingHistory(history)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-xl active:scale-90 transition-transform"
                          title="Visualizar itens"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => {
                            const newHistory = localSettings.savedHistory.filter(h => h.id !== history.id);
                            setLocalSettings(prev => ({ ...prev, savedHistory: newHistory }));
                            onUpdate({ ...localSettings, savedHistory: newHistory });
                          }}
                          className="p-2 text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
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
                  <p className="text-xs text-gray-400 font-medium">Nenhum histórico salvo ainda.</p>
                </div>
              )}
            </div>
          </div>

        </div>

          <div className="pt-2 border-t border-gray-100">
             <button 
              onClick={handleConfirm}
              className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl active:scale-95 transition-transform shadow-lg shadow-gray-200"
            >
              Confirmar
            </button>
          </div>
        </>
        )}
      </div>
    </div>
  );
};
