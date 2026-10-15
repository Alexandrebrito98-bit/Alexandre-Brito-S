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

  const currentTheme = APP_THEMES[DEFAULT_APP_THEME];

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
      setIsLoading(false);
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });

    // 2. Monitorar mudanças de estado da autenticação em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
      } catch (_) {}
      
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
          <h2 className="text-xl font-bold tracking-tight mb-1">SuperList</h2>
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
  const userName = user?.user_metadata?.nome || user?.user_metadata?.name || user?.email?.split('@')[0] || (isOfflineBypass ? 'Visitante Local' : 'Usuário');
  const userEmail = user?.email || (isOfflineBypass ? 'modo-local@superlist.app' : '');

  const authValue: AuthContextType = {
    session,
    user,
    userName,
    userEmail,
    signOut: handleSignOut,
    isOfflineMode: isOfflineBypass
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};
