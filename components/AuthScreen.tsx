import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { AppLogo } from './AppLogo';
import { Mail, User, KeyRound, ArrowRight, RefreshCw, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { APP_THEMES, DEFAULT_APP_THEME } from '../utils/appThemes';

interface AuthScreenProps {
  onBypassOffline?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onBypassOffline }) => {
  const currentAppTheme = APP_THEMES[DEFAULT_APP_THEME];
  
  // Etapas: 'email' (envio do OTP) ou 'otp' (validação do código)
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [token, setToken] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Contador para reenvio de código (60 segundos)
  const [resendCountdown, setResendCountdown] = useState(0);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (resendCountdown > 0) {
      countdownTimerRef.current = setTimeout(() => {
        setResendCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    };
  }, [resendCountdown]);

  const translateAuthError = (err: any): string => {
    if (!err) return 'Ocorreu um erro inesperado. Tente novamente.';
    const msg = (err.message || '').toLowerCase();
    const status = err.status || 0;

    if (msg.includes('invalid') && (msg.includes('token') || msg.includes('otp') || msg.includes('code'))) {
      return 'Código inválido ou expirado. Verifique os 6 dígitos recebidos no seu e-mail.';
    }
    if (msg.includes('expired')) {
      return 'O código expirou. Solicite o reenvio de um novo código.';
    }
    if (msg.includes('rate limit') || msg.includes('too many') || status === 429) {
      return 'Muitas tentativas em pouco tempo. Por favor, aguarde alguns instantes.';
    }
    if (msg.includes('invalid email') || msg.includes('email format') || msg.includes('email address')) {
      return 'Por favor, digite um endereço de e-mail válido.';
    }
    if (msg.includes('network') || msg.includes('fetch')) {
      return 'Erro de conexão com o Supabase. Verifique sua rede e tente novamente.';
    }
    return err.message || 'Não foi possível autenticar. Tente novamente.';
  };

  // Enviar código por e-mail (OTP)
  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Por favor, digite um endereço de e-mail válido.');
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMessage('Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.');
      return;
    }

    setIsLoading(true);
    try {
      const cleanNome = nome.trim();
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
          data: cleanNome ? { nome: cleanNome } : undefined
        }
      });

      if (error) {
        setErrorMessage(translateAuthError(error));
      } else {
        setStep('otp');
        setToken('');
        setSuccessMessage(`Código de 6 dígitos enviado para ${cleanEmail}`);
        setResendCountdown(60);
      }
    } catch (err: any) {
      setErrorMessage(translateAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Validar código de 6 dígitos (verifyOtp)
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanToken = token.trim();
    if (cleanToken.length < 6) {
      setErrorMessage('O código de verificação deve conter 6 dígitos.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: cleanToken,
        type: 'email'
      });

      if (error) {
        setErrorMessage(translateAuthError(error));
      } else if (data?.session) {
        setSuccessMessage('Acesso autorizado! Carregando seus dados...');
      }
    } catch (err: any) {
      setErrorMessage(translateAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Reenviar código
  const handleResendCode = async () => {
    if (resendCountdown > 0 || isLoading) return;
    await handleSendCode();
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 select-none relative overflow-y-auto"
      style={{
        backgroundColor: currentAppTheme.colors.background,
        color: currentAppTheme.colors.text
      }}
    >
      {/* Background decorativo suave */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: currentAppTheme.colors.primary }}
      />

      <div 
        style={{
          backgroundColor: currentAppTheme.colors.card,
          color: currentAppTheme.colors.text
        }}
        className="w-full max-w-md rounded-[2.5rem] p-6 sm:p-9 shadow-2xl border-0 relative z-10 animate-in fade-in zoom-in-95 duration-300"
      >
        {/* Cabeçalho com Logotipo e Nome do App */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3.5 transition-transform hover:scale-105">
            <AppLogo className="w-14 h-14 rounded-2xl shadow-md" backgroundColor={currentAppTheme.colors.primary} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            SuperList
          </h1>
          <p 
            style={{ color: currentAppTheme.colors.textSecondary }}
            className="text-xs sm:text-sm font-medium mt-1 max-w-xs"
          >
            Acesso seguro sem senha via código enviado ao seu e-mail
          </p>
        </div>

        {/* Aviso de Configuração do Supabase (quando as variáveis de ambiente não foram preenchidas) */}
        {!isSupabaseConfigured && (
          <div 
            style={{
              backgroundColor: currentAppTheme.colors.inputBg,
              borderColor: 'rgba(234, 179, 8, 0.3)'
            }}
            className="p-4 rounded-2xl border mb-6 text-left space-y-2.5 animate-in fade-in"
          >
            <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Configuração Supabase necessária</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              Para ativar a autenticação e sincronização na nuvem, defina as variáveis no arquivo <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">.env</code>:
            </p>
            <div className="bg-black/10 dark:bg-white/10 p-2.5 rounded-xl font-mono text-[10px] space-y-1">
              <div>VITE_SUPABASE_URL=https://...</div>
              <div>VITE_SUPABASE_ANON_KEY=eyJ...</div>
            </div>
            {onBypassOffline && (
              <button
                type="button"
                onClick={onBypassOffline}
                style={{
                  backgroundColor: currentAppTheme.colors.primary,
                  color: '#FFFFFF'
                }}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 border-0 cursor-pointer shadow-sm mt-1"
              >
                Continuar em Modo Local (Demonstração)
              </button>
            )}
          </div>
        )}

        {/* Mensagens de Sucesso e Erro */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Etapa 1: E-mail e Nome */}
        {step === 'email' && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label 
                style={{ color: currentAppTheme.colors.sectionTitle }}
                className="text-[10px] font-bold uppercase tracking-wider block mb-1.5"
              >
                Seu E-mail
              </label>
              <div 
                style={{ backgroundColor: currentAppTheme.colors.inputBg }}
                className="flex items-center gap-2.5 px-4 py-3.5 rounded-2xl border-0 transition-all focus-within:ring-2 focus-within:ring-emerald-500/40"
              >
                <Mail className="w-4 h-4 opacity-50 shrink-0" />
                <input
                  type="email"
                  required
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                  style={{ color: currentAppTheme.colors.text }}
                  className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm font-semibold placeholder:opacity-40"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label 
                  style={{ color: currentAppTheme.colors.sectionTitle }}
                  className="text-[10px] font-bold uppercase tracking-wider block"
                >
                  Nome
                </label>
                <span 
                  style={{ color: currentAppTheme.colors.textSecondary }}
                  className="text-[10px] font-medium"
                >
                  Novo cliente
                </span>
              </div>
              <div 
                style={{ backgroundColor: currentAppTheme.colors.inputBg }}
                className="flex items-center gap-2.5 px-4 py-3.5 rounded-2xl border-0 transition-all focus-within:ring-2 focus-within:ring-emerald-500/40"
              >
                <User className="w-4 h-4 opacity-50 shrink-0" />
                <input
                  type="text"
                  placeholder="Como gostaria de ser chamado(a)?"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  autoComplete="name"
                  style={{ color: currentAppTheme.colors.text }}
                  className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm font-semibold placeholder:opacity-40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isSupabaseConfigured}
              style={{
                backgroundColor: currentAppTheme.colors.primary,
                color: '#FFFFFF'
              }}
              className="w-full min-h-[50px] py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-0 cursor-pointer active:scale-[0.98] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enviando código...</span>
                </>
              ) : (
                <>
                  <span>Enviar código</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Etapa 2: Código de 6 dígitos (OTP) */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label 
                  style={{ color: currentAppTheme.colors.sectionTitle }}
                  className="text-[10px] font-bold uppercase tracking-wider block"
                >
                  Código de 6 dígitos
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  style={{ color: currentAppTheme.colors.primary }}
                  className="text-[11px] font-bold hover:underline border-0 bg-transparent cursor-pointer"
                >
                  Usar outro e-mail
                </button>
              </div>

              <div 
                style={{ backgroundColor: currentAppTheme.colors.inputBg }}
                className="flex items-center gap-2.5 px-4 py-3.5 rounded-2xl border-0 transition-all focus-within:ring-2 focus-within:ring-emerald-500/40"
              >
                <KeyRound className="w-4 h-4 opacity-50 shrink-0" />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  placeholder="000000"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                  autoComplete="one-time-code"
                  autoFocus
                  style={{ color: currentAppTheme.colors.text }}
                  className="w-full bg-transparent border-0 outline-none text-lg sm:text-xl font-mono font-bold tracking-widest text-center"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || token.trim().length < 6}
              style={{
                backgroundColor: currentAppTheme.colors.primary,
                color: '#FFFFFF'
              }}
              className="w-full min-h-[50px] py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-0 cursor-pointer active:scale-[0.98] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Reenviar código com espera de 60s */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCountdown > 0 || isLoading}
                style={{
                  color: resendCountdown > 0 ? currentAppTheme.colors.textSecondary : currentAppTheme.colors.primary
                }}
                className="text-xs font-bold border-0 bg-transparent cursor-pointer transition-colors disabled:cursor-not-allowed hover:underline"
              >
                {resendCountdown > 0 ? (
                  <span>Reenviar código em {resendCountdown}s</span>
                ) : (
                  <span>Reenviar código</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
