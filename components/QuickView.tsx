
import React, { useMemo, useState, useEffect } from 'react';
import { ShoppingItem } from '../types';

interface QuickViewProps {
  items: ShoppingItem[];
  total: number;
  onUpdateItem: (id: string, updates: Partial<ShoppingItem>) => void;
  onDeleteItem: (id: string) => void;
  onClose: () => void;
  textSizeClass: string;
  currency: string;
}

// Subcomponente para ações rápidas (lado esquerdo)
const QuickActions: React.FC<{
  item: ShoppingItem;
  onUpdate: (id: string, updates: Partial<ShoppingItem>) => void;
  onDelete: (id: string) => void;
}> = ({ item, onUpdate, onDelete }) => {
  return (
    <div className="flex flex-col gap-1 mr-3 shrink-0">
      <div className="flex gap-1">
        {/* Carrinho / Comprado - Cor VERDE quando ativo */}
        <button 
          onClick={() => onUpdate(item.id, { isPurchased: !item.isPurchased })}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90 ${
            item.isPurchased && item.isAvailable 
            ? 'bg-green-500 text-white shadow-sm' 
            : 'bg-gray-50 text-gray-400'
          }`}
          aria-label="Marcar como comprado"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </button>

        {/* Indisponível / Disponível - Cor AMARELA quando ativo */}
        <button 
          onClick={() => onUpdate(item.id, { isAvailable: !item.isAvailable })}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90 ${
            !item.isAvailable 
            ? 'bg-yellow-400 text-white shadow-sm' 
            : 'bg-gray-50 text-gray-400'
          }`}
          aria-label="Alternar disponibilidade"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </button>

        {/* Lixeira / Excluir */}
        <button 
          onClick={() => onDelete(item.id)}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-500 transition-all active:scale-90 active:bg-red-100"
          aria-label="Excluir produto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Subcomponente para edição inline da quantidade
const InlineQuantityControls: React.FC<{
  item: ShoppingItem;
  onUpdate: (id: string, updates: Partial<ShoppingItem>) => void;
}> = ({ item, onUpdate }) => {
  return (
    <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100 mr-2">
      <button 
        onClick={() => onUpdate(item.id, { quantity: Math.max(1, item.quantity - 1) })}
        className="w-6 h-6 flex items-center justify-center text-blue-600 font-bold active:bg-white rounded-md transition-colors text-xs"
        aria-label="Diminuir quantidade"
      >
        −
      </button>
      <span className="w-5 text-center font-bold text-gray-700 text-[10px]">{item.quantity}</span>
      <button 
        onClick={() => onUpdate(item.id, { quantity: item.quantity + 1 })}
        className="w-6 h-6 flex items-center justify-center text-blue-600 font-bold active:bg-white rounded-md transition-colors text-xs"
        aria-label="Aumentar quantidade"
      >
        +
      </button>
    </div>
  );
};

// Subcomponente para edição inline do preço
const InlinePriceInput: React.FC<{
  item: ShoppingItem;
  currency: string;
  textSizeClass: string;
  onUpdate: (id: string, updates: Partial<ShoppingItem>) => void;
}> = ({ item, currency, textSizeClass, onUpdate }) => {
  const [displayPrice, setDisplayPrice] = useState(
    item.unitPrice === 0 ? '' : item.unitPrice.toString().replace('.', ',')
  );

  useEffect(() => {
    const formatted = item.unitPrice === 0 ? '' : item.unitPrice.toString().replace('.', ',');
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
    onUpdate(item.id, { unitPrice: isNaN(price) ? 0 : price });
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <span className="text-gray-400 text-[10px] font-medium">{currency}</span>
      <input
        type="text"
        inputMode="decimal"
        value={displayPrice}
        onChange={(e) => handlePriceChange(e.target.value)}
        placeholder="0,00"
        className={`w-20 bg-transparent border-none text-right font-bold transition-colors focus:ring-0 p-0 outline-none ${
          item.isPurchased && item.isAvailable ? 'text-green-600' : 'text-gray-900'
        } ${textSizeClass}`}
      />
    </div>
  );
};

export const QuickView: React.FC<QuickViewProps> = ({ items, total, onUpdateItem, onDeleteItem, onClose, textSizeClass, currency }) => {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (!a.isAvailable && b.isAvailable) return 1;
      if (a.isAvailable && !b.isAvailable) return -1;
      
      if (a.isPurchased && !b.isPurchased) return 1;
      if (!a.isPurchased && b.isPurchased) return -1;
      
      return a.name.localeCompare(b.name);
    });
  }, [items]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden animate-in slide-in-from-bottom duration-300">
      <div className="bg-blue-600 px-6 py-6 text-white shrink-0">
        <h2 className="text-xl font-bold">Resumo da Compra</h2>
        <p className="text-blue-100 text-xs mt-1 uppercase tracking-widest font-semibold">
          Ajuste QTD e Preços diretamente abaixo
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {sortedItems.length === 0 ? (
          <p className="text-center text-gray-400 mt-20 font-medium">Nada para exibir</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {sortedItems.map(item => (
              <li key={item.id} className={`py-4 flex items-center transition-all ${!item.isAvailable ? 'bg-gray-50/50' : ''}`}>
                {/* Coluna de Ações Rápidas (Esquerda) */}
                <QuickActions item={item} onUpdate={onUpdateItem} onDelete={onDeleteItem} />

                <div className="flex flex-col flex-1 pr-2 min-w-0">
                  <div className="flex items-center">
                    <InlineQuantityControls item={item} onUpdate={onUpdateItem} />
                    <div className="flex flex-col min-w-0">
                      <span className={`font-bold text-gray-800 truncate ${textSizeClass} ${!item.isAvailable ? 'line-through text-gray-400' : ''}`}>
                        {item.name}
                      </span>
                      {item.isPurchased && item.isAvailable && (
                        <span className="text-[9px] w-fit bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md font-black uppercase tracking-tight mt-0.5">Comprado</span>
                      )}
                      {!item.isAvailable && (
                        <span className="text-[9px] w-fit bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-md font-black uppercase tracking-tight mt-0.5">Indisponível</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end shrink-0">
                  <InlinePriceInput 
                    item={item} 
                    currency={currency} 
                    textSizeClass={textSizeClass} 
                    onUpdate={onUpdateItem} 
                  />
                  <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                    <span>Sub:</span>
                    <span className="font-bold">
                      {currency} {(item.unitPrice * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col gap-4 shrink-0">
        <div className="flex justify-between items-center px-2">
          <span className="text-gray-500 font-semibold uppercase text-xs tracking-widest">Total Estimado</span>
          <span className="text-2xl font-black text-gray-900">
            {currency} {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <button 
          onClick={onClose}
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl active:scale-95 transition-transform shadow-lg shadow-blue-200"
        >
          Voltar para Lista
        </button>
      </div>
    </div>
  );
};
