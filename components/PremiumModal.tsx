
import React from 'react';

interface PremiumModalProps {
  onUpgrade: () => void;
  onClose: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ onUpgrade, onClose }) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-black mb-2">Upgrade Premium</h2>
          <p className="text-blue-100 text-sm">Você atingiu o limite de 15 itens da versão gratuita.</p>
        </div>
        
        <div className="p-8 space-y-4">
          <ul className="space-y-3">
            {[
              'Itens ilimitados na lista',
              'Múltiplas listas salvas',
              'Histórico de preços',
              'Exportar para WhatsApp'
            ].map(feature => (
              <li key={feature} className="flex items-center gap-3 text-gray-600 text-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          <div className="pt-4 flex flex-col gap-3">
             <button 
              onClick={onUpgrade}
              className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl active:scale-95 transition-transform shadow-lg shadow-blue-200"
            >
              Liberar agora (Simulado)
            </button>
            <button 
              onClick={onClose}
              className="w-full py-2 text-gray-400 font-bold text-sm"
            >
              Talvez mais tarde
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
