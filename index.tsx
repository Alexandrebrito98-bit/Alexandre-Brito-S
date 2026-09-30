
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerSW } from 'virtual:pwa-register';

// Registra e atualiza automaticamente o Service Worker para garantir novos ícones e cache limpo
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateSW(true);
    },
  });
}

// Invalida quaisquer caches antigos de versões anteriores para assegurar os novos ícones PWA
if (typeof window !== 'undefined' && 'caches' in window) {
  caches.keys().then((cacheNames) => {
    cacheNames.forEach((cacheName) => {
      // Se houver algum cache legado não gerenciado pelo workbox atual, limpa
      if (cacheName.startsWith('superlist-old-') || cacheName.includes('legacy')) {
        caches.delete(cacheName);
      }
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
