
import React from 'react';

interface VoiceOverlayProps {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  onClose: () => void;
}

export const VoiceOverlay: React.FC<VoiceOverlayProps> = ({ isListening, isProcessing, transcript, onClose }) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-blue-600/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-sm text-center text-white">
        <div className="flex justify-center items-center gap-1 h-20 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i}
              className={`w-1.5 bg-white rounded-full transition-all duration-300 ${isListening ? 'animate-bounce' : 'h-2'}`}
              style={{ 
                height: isListening ? `${Math.random() * 60 + 20}%` : '8px',
                animationDelay: `${i * 0.1}s` 
              }}
            />
          ))}
        </div>

        <h2 className="text-2xl font-bold mb-4">
          {isListening ? 'Ouvindo...' : isProcessing ? 'Entendendo...' : 'Pronto!'}
        </h2>

        <div className="bg-white/10 p-6 rounded-3xl border border-white/20 min-h-[120px] flex items-center justify-center italic text-lg leading-relaxed">
          {transcript || "Ex: 'Dois leites e um pão'"}
        </div>

        {isProcessing && (
          <div className="mt-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {!isProcessing && (
          <button 
            onClick={onClose}
            className="mt-12 px-8 py-3 bg-white text-blue-600 font-bold rounded-2xl active:scale-95 transition-transform"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};
