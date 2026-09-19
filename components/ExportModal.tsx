
import React from 'react';

interface ExportModalProps {
  onConfirm: (includePrice: boolean) => void;
  onSaveHistory: () => void;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onConfirm, onSaveHistory, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" onClick={onClose} />
        
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
            onClick={onSaveHistory}
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
    </div>
  );
};
