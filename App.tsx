
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ShoppingItem, SortMode, AppSettings, FilterStatus, SavedList } from './types';
import { Header } from './components/Header';
import { ItemCard } from './components/ItemCard';
import { SettingsModal } from './components/SettingsModal';
import { ExportModal } from './components/ExportModal';
import { ChevronUp } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useKeyboardAvoidance } from './hooks/useKeyboardAvoidance';

const STORAGE_KEY = 'superlist_data';
const SETTINGS_KEY = 'superlist_settings';

const App: React.FC = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    textSize: 'small',
    sortMode: SortMode.NameAZ,
    isBudgetModeActive: false,
    budgetLimit: 0,
    currency: '€',
    isSwipeEnabled: true,
    rightSwipeAction: 'purchase',
    leftSwipeAction: 'unavailable',
    savedHistory: [],
    isOrganizeByMarketEnabled: false,
    markets: [],
  });
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [settingsInitialSection, setSettingsInitialSection] = useState<'general' | 'markets'>('general');
  const [isViewMode, setIsViewMode] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState<string>(''); 
  const [newItemPrice, setNewItemPrice] = useState<string>(''); 
  
  // Estados para status pré-definido
  const [isNewItemPurchased, setIsNewItemPurchased] = useState(false);
  const [isNewItemUnavailable, setIsNewItemUnavailable] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [deletedItemInfo, setDeletedItemInfo] = useState<{ item: ShoppingItem; originalIndex: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { isKeyboardActive, keyboardSpacerHeight } = useKeyboardAvoidance();

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalValue = useMemo(() => items.filter(i => i.isAvailable).reduce((acc, curr) => acc + (curr.unitPrice * curr.quantity), 0), [items]);

  const saveToHistory = useCallback(() => {
    if (items.length === 0) return;

    const newList: SavedList = {
      id: crypto.randomUUID(),
      date: Date.now(),
      totalItems: items.length,
      totalValue: totalValue,
      items: [...items]
    };

    setSettings(prev => ({
      ...prev,
      savedHistory: [newList, ...(prev.savedHistory || [])]
    }));

    setFeedback('Lista salva no histórico');
    setTimeout(() => setFeedback(null), 2000);
    setShowExportModal(false);
  }, [items, totalValue]);

  useEffect(() => {
    const savedItems = localStorage.getItem(STORAGE_KEY);
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedItems) setItems(JSON.parse(savedItems) as ShoppingItem[]);
    if (savedSettings) setSettings(prev => ({ ...prev, ...(JSON.parse(savedSettings) as Partial<AppSettings>) }));
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }, [settings]);

  const handleDeleteItem = useCallback((itemToDelete: ShoppingItem) => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }

    const originalIndex = items.findIndex(i => i.id === itemToDelete.id);
    setDeletedItemInfo({ 
      item: itemToDelete, 
      originalIndex: originalIndex >= 0 ? originalIndex : 0 
    });

    setItems(prev => prev.filter(i => i.id !== itemToDelete.id));

    undoTimerRef.current = setTimeout(() => {
      setDeletedItemInfo(null);
    }, 3000);
  }, [items]);

  const handleUndoDelete = useCallback(() => {
    if (!deletedItemInfo) return;
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    setItems(prev => {
      const next = [...prev];
      const targetIdx = Math.min(deletedItemInfo.originalIndex, next.length);
      next.splice(targetIdx, 0, deletedItemInfo.item);
      return next;
    });

    setFeedback(`"${deletedItemInfo.item.name}" restaurado`);
    setTimeout(() => setFeedback(null), 2000);
    setDeletedItemInfo(null);
  }, [deletedItemInfo]);

  const handlePurchasedButtonClick = useCallback(() => {
    const name = newItemName.trim();
    if (name) {
      const existingIndex = items.findIndex(i => i.name.toLowerCase() === name.toLowerCase());
      if (existingIndex !== -1) {
        // Exceção solicitada: se o item já existe e o usuário toca no botão de comprado (🛒),
        // atualiza o item existente para comprado em vez de duplicar.
        const existing = items[existingIndex];
        const price = parseFloat(newItemPrice.replace(',', '.'));
        const qty = parseInt(newItemQty);

        const updatedItem: ShoppingItem = {
          ...existing,
          isPurchased: true,
          isAvailable: true,
          ...(qty && qty > 0 ? { quantity: qty } : {}),
          ...(!isNaN(price) && price > 0 ? { unitPrice: price } : {})
        };

        setItems(prev => {
          const next = [...prev];
          next[existingIndex] = updatedItem;
          return next;
        });

        setNewItemName('');
        setNewItemQty('');
        setNewItemPrice('');
        setIsNewItemPurchased(false);
        setIsNewItemUnavailable(false);

        setFeedback(`"${existing.name}" marcado como comprado`);
        setTimeout(() => setFeedback(null), 2000);
        inputRef.current?.focus();
        return;
      }
    }

    setIsNewItemPurchased(prev => !prev);
    setIsNewItemUnavailable(false);
  }, [newItemName, newItemPrice, newItemQty, items]);

  const addItem = useCallback(() => {
    const name = newItemName.trim();
    if (!name) return;
    
    const existingIndex = items.findIndex(i => i.name.toLowerCase() === name.toLowerCase());
    if (existingIndex !== -1) {
      if (isNewItemPurchased) {
        const existing = items[existingIndex];
        const price = parseFloat(newItemPrice.replace(',', '.'));
        const qty = parseInt(newItemQty);

        const updatedItem: ShoppingItem = {
          ...existing,
          isPurchased: true,
          isAvailable: true,
          ...(qty && qty > 0 ? { quantity: qty } : {}),
          ...(!isNaN(price) && price > 0 ? { unitPrice: price } : {})
        };

        setItems(prev => {
          const next = [...prev];
          next[existingIndex] = updatedItem;
          return next;
        });

        setNewItemName('');
        setNewItemQty('');
        setNewItemPrice('');
        setIsNewItemPurchased(false);
        setIsNewItemUnavailable(false);

        setFeedback(`"${existing.name}" marcado como comprado`);
        setTimeout(() => setFeedback(null), 2000);
        inputRef.current?.focus();
        return;
      }

      setFeedback('Item já na lista');
      setTimeout(() => setFeedback(null), 2000);
      return;
    }

    const price = parseFloat(newItemPrice.replace(',', '.'));

    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name: name.charAt(0).toUpperCase() + name.slice(1),
      quantity: parseInt(newItemQty) || 1,
      unitPrice: isNaN(price) ? 0 : price,
      isAvailable: !isNewItemUnavailable,
      isPurchased: isNewItemPurchased,
      addedAt: Date.now()
    };
    setItems(prev => [newItem, ...prev]);
    
    // Reset de campos e status
    setNewItemName(''); 
    setNewItemQty('');
    setNewItemPrice('');
    setIsNewItemPurchased(false);
    setIsNewItemUnavailable(false);
    
    inputRef.current?.focus();
  }, [newItemName, newItemQty, newItemPrice, items, isNewItemPurchased, isNewItemUnavailable]);

  const handleExport = useCallback((includePrice: boolean) => {
    if (items.length === 0) return;

    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const currency = settings.currency;

    // Título
    doc.setFontSize(18);
    doc.text('SuperList - Lista de Compras', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Data: ${dateStr}`, 14, 30);

    const sortAlpha = (a: ShoppingItem, b: ShoppingItem) => a.name.localeCompare(b.name);
    
    const available = items.filter(i => i.isAvailable && !i.isPurchased).sort(sortAlpha);
    const purchased = items.filter(i => i.isAvailable && i.isPurchased).sort(sortAlpha);
    const unavailable = items.filter(i => !i.isAvailable).sort(sortAlpha);

    let currentY = 40;

    const addSection = (title: string, data: ShoppingItem[]) => {
      if (data.length === 0) return;

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(title, 14, currentY);
      currentY += 5;

      const columns = ['Qtd', 'Produto'];
      if (includePrice) {
        columns.push('Preço Un.', 'Total');
      }

      const rows = data.map(i => {
        const row = [i.quantity.toString(), i.name];
        if (includePrice) {
          row.push(
            `${currency} ${i.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            `${currency} ${(i.unitPrice * i.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          );
        }
        return row;
      });

      autoTable(doc, {
        startY: currentY,
        head: [columns],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] }, // Blue-600
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          currentY = data.cursor ? data.cursor.y + 15 : currentY + 15;
        }
      });
      
      // Update currentY after table
      const finalY = (doc as any).lastAutoTable.finalY;
      currentY = finalY + 15;
    };

    addSection('PARA COMPRAR', available);
    addSection('NO CARRINHO', purchased);
    addSection('INDISPONÍVEIS', unavailable);

    if (includePrice) {
      const total = items.filter(i => i.isAvailable).reduce((acc, curr) => acc + (curr.unitPrice * curr.quantity), 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`VALOR TOTAL ESTIMADO: ${currency} ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, currentY);
    }

    doc.save(`SuperList_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportModal(false);
  }, [items, settings.currency]);

  const sections = useMemo<Record<string, ShoppingItem[]>>(() => {
    let baseFiltered = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterStatus === 'pending') baseFiltered = baseFiltered.filter(i => i.isAvailable && !i.isPurchased);
    if (filterStatus === 'purchased') baseFiltered = baseFiltered.filter(i => i.isAvailable && i.isPurchased);
    if (filterStatus === 'unavailable') baseFiltered = baseFiltered.filter(i => !i.isAvailable);

    const sortFn = (a: ShoppingItem, b: ShoppingItem) => {
      if (settings.sortMode === SortMode.NameAZ) return a.name.localeCompare(b.name);
      if (settings.sortMode === SortMode.Newest) return b.addedAt - a.addedAt;
      const valA = a.unitPrice * a.quantity;
      const valB = b.unitPrice * b.quantity;
      return settings.sortMode === SortMode.PriceAsc ? valA - valB : valB - valA;
    };

    const grouped = {
      available: baseFiltered.filter(i => i.isAvailable && !i.isPurchased).sort(sortFn),
      purchased: baseFiltered.filter(i => i.isAvailable && i.isPurchased).sort(sortFn),
      unavailable: baseFiltered.filter(i => !i.isAvailable).sort(sortFn)
    };

    return grouped;
  }, [items, searchTerm, settings.sortMode, filterStatus]);

  const budgetExceeded = settings.isBudgetModeActive && totalValue > settings.budgetLimit;

  const clearList = (type: 'all' | 'purchased' | 'unavailable') => {
    if (type === 'all') setItems([]);
    else if (type === 'purchased') setItems(prev => prev.filter(i => !(i.isAvailable && i.isPurchased)));
    else if (type === 'unavailable') setItems(prev => prev.filter(i => i.isAvailable));
    setShowClearConfirm(false);
  };

  return (
    <div className={`min-h-screen flex flex-col pb-32 ${settings.textSize === 'small' ? 'text-sm' : settings.textSize === 'large' ? 'text-lg' : 'text-base'}`}>
      <Header 
        itemCount={items.length} 
        availableCount={items.filter(i => i.isAvailable && !i.isPurchased).length}
        purchasedCount={items.filter(i => i.isAvailable && i.isPurchased).length}
        unavailableCount={items.filter(i => !i.isAvailable).length}
        onOpenSettings={() => {
          setSettingsInitialSection('general');
          setShowSettings(true);
        }}
        onClearList={() => setShowClearConfirm(true)}
        isViewMode={isViewMode}
        onToggleViewMode={() => setIsViewMode(!isViewMode)}
        onExport={() => setShowExportModal(true)}
        currentFilter={filterStatus}
        onFilterChange={setFilterStatus}
      />

      <main className="flex-1 px-4 py-2 space-y-4 max-w-lg mx-auto w-full">
        {!isViewMode && (
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-2">
            <div className="flex flex-col gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
                placeholder="Produto"
                className="w-full px-4 py-3 rounded-xl border-gray-200 border bg-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              
              <div className="flex gap-2 w-full items-center">
                {/* Container Qtd e Preço */}
                <div className="flex flex-1 items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-inner">
                  <div className="flex items-center flex-1 px-3">
                    <span className="text-[10px] font-bold text-gray-400 mr-1 uppercase">Qtd</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addItem()}
                      placeholder="1"
                      className="w-full bg-transparent py-3 text-sm font-bold outline-none text-gray-700"
                    />
                  </div>
                  <div className="w-px h-6 bg-gray-200" />
                  <div className="flex items-center flex-[1.5] px-3">
                    <span className="text-[10px] font-bold text-gray-400 mr-1 uppercase">{settings.currency}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value.replace(/[^0-9.,]/g, ''))}
                      onBlur={() => {
                        const price = parseFloat(newItemPrice.replace(',', '.'));
                        if (!isNaN(price) && price !== 0) {
                          setNewItemPrice(price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                        }
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && addItem()}
                      placeholder="0,00"
                      className="w-full bg-transparent py-3 text-sm font-bold outline-none text-gray-700"
                    />
                  </div>
                </div>

                {/* Botões de Status Rápido movidos para cá */}
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={handlePurchasedButtonClick}
                    className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-all active:scale-90 ${
                      isNewItemPurchased 
                      ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-100' 
                      : 'bg-white text-gray-400 border-gray-200'
                    }`}
                    aria-label="Adicionar ou marcar como comprado"
                    title={newItemName.trim() ? "Marcar item existente como comprado" : "Adicionar como comprado"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </button>
                  
                  <button 
                    onClick={addItem}
                    className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-600 text-white border border-blue-600 shadow-md shadow-blue-100 transition-all active:scale-90"
                    aria-label="Adicionar item"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            {feedback && <p className="text-amber-600 text-[10px] mt-1 px-1 font-bold uppercase">{feedback}</p>}
          </div>
        )}

        <div className="space-y-4">
          <div className="relative">
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar na lista..." className="w-full bg-gray-100/50 rounded-xl py-2 pl-10 pr-4 text-xs outline-none" />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          <div className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm min-h-[100px]">
          {filterStatus !== 'all' && (
            <div className="px-2 pb-4 flex justify-between items-center animate-in fade-in slide-in-from-top-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Filtrando por: {filterStatus === 'pending' ? 'Disponíveis' : filterStatus === 'purchased' ? 'Comprados' : 'Indisponíveis'}</span>
              <button onClick={() => setFilterStatus('all')} className="text-[10px] font-bold text-blue-600 uppercase">Limpar Filtro</button>
            </div>
          )}

          {(Object.entries(sections) as [string, ShoppingItem[]][]).map(([key, list]) => list && list.length > 0 && (
            <div key={key} className="mb-6 last:mb-0">
              <div className="flex items-center gap-2 px-1 pb-2 opacity-70">
                <span className={`w-1.5 h-1.5 rounded-full ${key === 'available' ? 'bg-blue-500' : key === 'purchased' ? 'bg-green-500' : 'bg-yellow-400'}`}></span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{key === 'available' ? 'Para Comprar' : key === 'purchased' ? 'No Carrinho' : 'Indisponíveis'}</span>
              </div>
              {list.map(item => (
                <ItemCard 
                  key={item.id} 
                  item={item} 
                  onUpdate={(u) => setItems(prev => prev.map(i => i.id === item.id ? {...i, ...u} : i))} 
                  onDelete={() => handleDeleteItem(item)} 
                  textSizeClass="" 
                  titleSizeClass="" 
                  settings={settings} 
                  isViewMode={isViewMode}
                  onOpenSettingsMarkets={() => {
                    setSettingsInitialSection('markets');
                    setShowSettings(true);
                  }}
                />
              ))}
            </div>
          ))}
          {(Object.values(sections) as ShoppingItem[][]).every(l => l.length === 0) && (
            <div className="py-12 text-center">
               <p className="text-gray-400 text-sm font-medium">Nenhum item encontrado com este filtro.</p>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic temporary spacer for keyboard avoidance (smoothly collapses to 0 when keyboard closes) */}
      <div 
        style={{ height: keyboardSpacerHeight }} 
        className="transition-[height] duration-300 ease-out pointer-events-none w-full shrink-0"
        aria-hidden="true" 
      />
    </main>

      {/* Toast / Snackbar de Desfazer Exclusão (3 segundos) */}
      {deletedItemInfo && (
        <div className={`fixed ${isKeyboardActive ? 'bottom-4' : 'bottom-24'} left-4 right-4 max-w-sm mx-auto z-50 animate-in slide-in-from-bottom-4 fade-in duration-200`}>
          <div className="bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-gray-800 relative overflow-hidden">
            {/* Barra de contagem regressiva animada de 3 segundos */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 pointer-events-none">
              <div className="h-full bg-blue-500 animate-undo-progress" />
            </div>

            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-200 truncate">
                Item <span className="font-bold text-white">"{deletedItemInfo.item.name}"</span> excluído
              </span>
            </div>

            <button
              type="button"
              onClick={handleUndoDelete}
              className="shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a5 5 0 015 5v2m0 0l-4-4m4 4l4-4" />
              </svg>
              Desfazer
            </button>
          </div>
        </div>
      )}

      <footer className={`fixed bottom-0 left-0 right-0 bg-white border-t p-6 flex flex-col items-center z-30 transition-all duration-300 ease-in-out ${
        budgetExceeded ? 'bg-red-50 border-red-500 text-red-600' : ''
      } ${
        isKeyboardActive ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}>
        <div className="w-full flex justify-between items-center font-bold">
          <span className="text-xs uppercase tracking-widest">Total Estimado</span>
          <span className="text-xl">{settings.currency} {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        {settings.isBudgetModeActive && (
          <div className="w-full mt-1">
            <div className={`w-full flex justify-between items-center ${budgetExceeded ? 'opacity-75' : 'opacity-60'}`}>
              <span className="text-[10px] uppercase tracking-widest font-medium">Orçamento Limite</span>
              <span className="text-sm font-bold">{settings.currency} {settings.budgetLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            {budgetExceeded && (
              <div className="w-full flex justify-between items-center text-[10px] mt-0.5 leading-tight opacity-90">
                <span className="font-medium">Acima do limite:</span>
                <span className="font-bold">{settings.currency} {(totalValue - settings.budgetLimit).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>
        )}
      </footer>

      {showScrollTop && !isKeyboardActive && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-28 right-6 z-40 bg-white p-2.5 rounded-full shadow-xl border border-gray-100 text-blue-600 transition-all animate-in fade-in zoom-in duration-300 active:scale-90"
          aria-label="Voltar ao topo"
        >
          <ChevronUp size={20} strokeWidth={3} />
        </button>
      )}

      {showSettings && (
        <SettingsModal 
          settings={settings} 
          onUpdate={setSettings} 
          onClose={() => setShowSettings(false)} 
          initialSection={settingsInitialSection} 
        />
      )}
      {showExportModal && (
        <ExportModal 
          onConfirm={handleExport} 
          onSaveHistory={saveToHistory}
          onClose={() => setShowExportModal(false)} 
        />
      )}
      
      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center animate-in fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowClearConfirm(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" onClick={() => setShowClearConfirm(false)} />
            <h2 className="text-xl font-bold mb-8 text-center text-gray-900">Limpar Lista?</h2>
            <div className="space-y-3">
              <button 
                onClick={() => clearList('purchased')} 
                className="w-full py-4 bg-green-50 text-green-700 font-bold rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Remover Comprados
              </button>
              <button 
                onClick={() => clearList('unavailable')} 
                className="w-full py-4 bg-amber-50 text-amber-700 font-bold rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636" />
                </svg>
                Remover Indisponíveis
              </button>
              <button 
                onClick={() => clearList('all')} 
                className="w-full py-4 bg-red-50 text-red-700 font-bold rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remover TUDO
              </button>
              <button 
                onClick={() => setShowClearConfirm(false)} 
                className="w-full py-4 text-gray-400 font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
