import React, { useState } from 'react';
import { ChevronLeft, ArrowRight, Bookmark, Trash2 } from 'lucide-react';

interface ExportModalProps {
  onConfirm: (includePrice: boolean) => void;
  onSaveHistory: (clearAfterSave: boolean) => void;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onConfirm, onSaveHistory, onClose }) => {
  const [showSaveOptions, setShowSaveOptions] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" onClick={onClose} />
        
        {showSaveOptions ? (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-2">
              <button 
                onClick={() => setShowSaveOptions(false)}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 active:scale-90 transition-transform"
                title="Voltar"
                aria-label="Voltar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-gray-900 text-center flex-1 pr-8">Salvar no Histórico</h2>
            </div>
            
            <p className="text-gray-500 text-sm mb-6 text-center leading-relaxed">
              Como deseja proceder com a lista atual após salvar no histórico?
            </p>

            <div className="space-y-3">
              <button 
                onClick={() => onSaveHistory(true)}
                className="w-full py-4 px-5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl active:scale-[0.98] transition-all text-left flex items-center justify-between shadow-md shadow-green-100"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm">Salvar e Limpar Lista</div>
                    <div className="text-[11px] text-green-100 font-medium truncate">Salva e esvazia os produtos da lista</div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 shrink-0 opacity-80 ml-2" />
              </button>

              <button 
                onClick={() => onSaveHistory(false)}
                className="w-full py-4 px-5 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-800 font-bold rounded-2xl active:scale-[0.98] transition-all text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gray-200/80 flex items-center justify-center shrink-0 text-gray-600">
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm">Somente Salvar</div>
                    <div className="text-[11px] text-gray-500 font-medium truncate">Mantém todos os produtos na lista</div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 shrink-0 opacity-60 text-gray-400 ml-2" />
              </button>

              <button 
                onClick={() => setShowSaveOptions(false)}
                className="w-full py-3 text-gray-400 hover:text-gray-600 font-bold text-sm transition-colors mt-1"
              >
                Voltar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Exportar Lista</h2>
            <p className="text-gray-500 text-sm mb-8 text-center leading-relaxed">
              Como você deseja baixar o arquivo PDF ou salvar no histórico?
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={() => onConfirm(true)}
                className="w-full py-4 px-6 bg-blue-600 text-white font-bold rounded-2xl active:scale-95 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Baixar com preços</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button 
                onClick={() => onConfirm(false)}
                className="w-full py-4 px-6 bg-gray-100 text-gray-700 font-bold rounded-2xl active:bg-gray-200 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Apenas produtos</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="h-px bg-gray-100 my-2" />

              <button 
                onClick={() => setShowSaveOptions(true)}
                className="w-full py-4 px-6 bg-green-50 text-green-700 font-bold rounded-2xl active:bg-green-100 transition-all flex items-center justify-between border border-green-100"
              >
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>Salvar no Histórico</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button 
                onClick={onClose}
                className="w-full py-4 text-gray-400 font-bold text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
