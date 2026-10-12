import React, { useState } from 'react';
import { ChevronLeft, ArrowRight, Bookmark, Trash2 } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../i18n';
import { AppThemeConfig } from '../utils/appThemes';

interface ExportModalProps {
  onConfirm: (includePrice: boolean) => void;
  onSaveHistory: (clearAfterSave: boolean) => void;
  onClose: () => void;
  lang?: Language;
  themeConfig?: AppThemeConfig;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onConfirm, onSaveHistory, onClose, lang = 'pt', themeConfig }) => {
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const t = getTranslation(lang);

  const cardBg = themeConfig?.colors.card || '#FFFFFF';
  const textColor = themeConfig?.colors.text || '#0F172A';
  const textSecondaryColor = themeConfig?.colors.textSecondary || '#64748B';
  const primaryColor = themeConfig?.colors.primary || '#2563EB';
  const inputBg = themeConfig?.colors.inputBg || '#F1F5F9';

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div 
        style={{
          backgroundColor: cardBg,
          color: textColor
        }}
        className="relative w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 border-0 shadow-none animate-in slide-in-from-bottom duration-300"
      >
        <div className="w-12 h-1.5 rounded-full mx-auto mb-6 sm:hidden opacity-30" style={{ backgroundColor: textSecondaryColor }} onClick={onClose} />
        
        {showSaveOptions ? (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-2">
              <button 
                onClick={() => setShowSaveOptions(false)}
                style={{
                  backgroundColor: inputBg,
                  color: textSecondaryColor
                }}
                className="w-8 h-8 flex items-center justify-center rounded-xl active:scale-90 transition-transform border-0 shadow-none"
                title={t.back}
                aria-label={t.back}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 style={{ color: primaryColor }} className="text-base font-bold uppercase tracking-wider text-center flex-1 pr-8">{t.saveOptionsTitle}</h2>
            </div>
            
            <p style={{ color: textSecondaryColor }} className="text-sm mb-6 text-center leading-relaxed">
              {t.saveOptionsSubtitle}
            </p>

            <div className="space-y-3">
              <button 
                onClick={() => onSaveHistory(true)}
                style={{
                  backgroundColor: primaryColor,
                  color: '#FFFFFF'
                }}
                className="w-full py-4 px-5 font-bold rounded-2xl active:scale-[0.98] transition-all text-left flex items-center justify-between border-0 shadow-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm">{t.saveAndClear}</div>
                    <div className="text-[11px] opacity-80 font-medium truncate">{t.saveAndClearDesc}</div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 shrink-0 opacity-80 ml-2" />
              </button>

              <button 
                onClick={() => onSaveHistory(false)}
                style={{
                  backgroundColor: inputBg,
                  color: textColor
                }}
                className="w-full py-4 px-5 font-bold rounded-2xl active:scale-[0.98] transition-all text-left flex items-center justify-between border-0 shadow-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center shrink-0" style={{ color: textColor }}>
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm">{t.onlySave}</div>
                    <div className="text-[11px] font-medium truncate" style={{ color: textSecondaryColor }}>{t.onlySaveDesc}</div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 shrink-0 opacity-60 ml-2" style={{ color: textSecondaryColor }} />
              </button>

              <button 
                onClick={() => setShowSaveOptions(false)}
                style={{ color: textSecondaryColor }}
                className="w-full py-3 font-bold text-sm transition-colors mt-1"
              >
                {t.back}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 style={{ color: primaryColor }} className="text-base font-bold uppercase tracking-wider mb-2 text-center">{t.exportModalTitle}</h2>
            <p style={{ color: textSecondaryColor }} className="text-sm mb-8 text-center leading-relaxed">
              {t.exportModalSubtitle}
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={() => onConfirm(true)}
                style={{
                  backgroundColor: primaryColor,
                  color: '#FFFFFF'
                }}
                className="w-full py-4 px-6 font-bold rounded-2xl active:scale-95 transition-all flex items-center justify-between border-0 shadow-none"
              >
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{t.downloadWithPrices}</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button 
                onClick={() => onConfirm(false)}
                style={{
                  backgroundColor: inputBg,
                  color: textColor
                }}
                className="w-full py-4 px-6 font-bold rounded-2xl active:scale-95 transition-all flex items-center justify-between border-0 shadow-none"
              >
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{t.downloadOnlyProducts}</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button 
                onClick={() => setShowSaveOptions(true)}
                style={{
                  backgroundColor: inputBg,
                  color: primaryColor
                }}
                className="w-full py-4 px-6 font-bold rounded-2xl active:scale-95 transition-all flex items-center justify-between border-0 shadow-none"
              >
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>{t.saveToHistory}</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button 
                onClick={onClose}
                style={{ color: textSecondaryColor }}
                className="w-full py-4 font-bold text-sm"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
