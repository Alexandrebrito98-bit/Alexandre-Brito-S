import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../supabase';
import { AuthScreen } from './AuthScreen';
import { AppLogo } from './AppLogo';
import { APP_THEMES, DEFAULT_APP_THEME } from '../utils/appThemes';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userName: string;
  userEmail: string;
  signOut: () => Promise<void>;
  isOfflineMode: boolean;
  updateUserName?: (newName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthGate');
  }
  return context;
};

interface AuthGateProps {
  children: ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineBypass, setIsOfflineBypass] = useState(false);
  const [liveUserName, setLiveUserName] = useState<string>(() => {
    try {
      return localStorage.getItem('compra_certa_user_name') || '';
    } catch {
      return '';
    }
  });

  const currentTheme = APP_THEMES[DEFAULT_APP_THEME];

  useEffect(() => {
    const handleNameChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (typeof customEvent.detail === 'string') {
        const trimmed = customEvent.detail.trim();
        setLiveUserName(trimmed);
        try {
          if (trimmed) {
            localStorage.setItem('compra_certa_user_name', trimmed);
          } else {
            localStorage.removeItem('compra_certa_user_name');
          }
        } catch (_) {}
      }
    };
    window.addEventListener('compra_certa:user-name-changed', handleNameChange);
    return () => {
      window.removeEventListener('compra_certa:user-name-changed', handleNameChange);
    };
  }, []);

  useEffect(() => {
    // Se o Supabase não estiver configurado nas variáveis de ambiente
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // 1. Obter sessão inicial
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!isMounted) return;
      if (error) {
        console.warn('Erro ao obter sessão inicial:', error.message);
      }
      setSession(initialSession);
      const metaNome = initialSession?.user?.user_metadata?.nome || initialSession?.user?.user_metadata?.name;
      if (metaNome && typeof metaNome === 'string') {
        const clean = metaNome.trim();
        if (clean) {
          setLiveUserName(clean);
          try {
            localStorage.setItem('compra_certa_user_name', clean);
          } catch (_) {}
        }
      }
      setIsLoading(false);
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });

    // 2. Monitorar mudanças de estado da autenticação em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);
      const metaNome = currentSession?.user?.user_metadata?.nome || currentSession?.user?.user_metadata?.name;
      if (metaNome && typeof metaNome === 'string') {
        const clean = metaNome.trim();
        if (clean) {
          setLiveUserName(clean);
          try {
            localStorage.setItem('compra_certa_user_name', clean);
          } catch (_) {}
        }
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdateUserName = async (newName: string) => {
    const trimmed = newName.trim();
    setLiveUserName(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem('compra_certa_user_name', trimmed);
      } else {
        localStorage.removeItem('compra_certa_user_name');
      }
    } catch (_) {}

    window.dispatchEvent(new CustomEvent('compra_certa:user-name-changed', { detail: trimmed }));

    if (session && isSupabaseConfigured) {
      try {
        await supabase.auth.updateUser({
          data: { nome: trimmed }
        });
      } catch (err) {
        console.warn('Erro ao atualizar nome no Supabase:', err);
      }
    }
  };

  // Função centralizada para encerrar a sessão
  const handleSignOut = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Erro ao sair da conta:', err);
    } finally {
      // Limpar todos os dados locais do app
      try {
        localStorage.removeItem('superlist_multi_lists');
        localStorage.removeItem('superlist_active_list_id');
        localStorage.removeItem('superlist_data');
        localStorage.removeItem('superlist_settings');
        localStorage.removeItem('superlist_view_sort_mode');
        localStorage.removeItem('compra_certa_user_name');
      } catch (_) {}
      
      setLiveUserName('');
      setSession(null);
      setIsOfflineBypass(false);
    }
  };

  // Indicador de Carregamento inicial elegante
  if (isLoading) {
    return (
      <div 
        style={{
          backgroundColor: currentTheme.colors.background,
          color: currentTheme.colors.text
        }}
        className="min-h-screen w-full flex flex-col items-center justify-center p-4 select-none"
      >
        <div className="relative flex flex-col items-center animate-pulse">
          <AppLogo className="w-16 h-16 rounded-2xl shadow-xl mb-4" backgroundColor={currentTheme.colors.primary} />
          <h2 className="text-xl font-bold tracking-tight mb-1">Compra Certa</h2>
          <p 
            style={{ color: currentTheme.colors.textSecondary }}
            className="text-xs font-medium"
          >
            Carregando autenticação...
          </p>
        </div>
      </div>
    );
  }

  // Sem sessão e sem bypass offline: exibe a tela de acesso
  if (!session && !isOfflineBypass) {
    return (
      <AuthScreen 
        onBypassOffline={!isSupabaseConfigured ? () => setIsOfflineBypass(true) : undefined} 
      />
    );
  }

  const user = session?.user || null;
  const metaName = (user?.user_metadata?.nome || user?.user_metadata?.name || '')?.toString().trim();
  const userName = metaName || liveUserName || '';
  const userEmail = user?.email || (isOfflineBypass ? 'modo-local@compracerta.app' : '');

  const authValue: AuthContextType = {
    session,
    user,
    userName,
    userEmail,
    signOut: handleSignOut,
    isOfflineMode: isOfflineBypass,
    updateUserName: handleUpdateUserName
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};
