import { FormEvent, useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { Heart, Mail, Lock, ArrowRight } from 'lucide-react';
import { t } from '../i18n';
import type { Locale } from '../types';
import type { Session } from '@supabase/supabase-js';

interface AuthProps {
  onSession: (session: Session | null) => void;
  locale: Locale;
}

export default function Auth({ onSession, locale }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const requiredInviteCode = import.meta.env.VITE_SIGNUP_INVITE_CODE?.trim();
  const requiresInviteCode = Boolean(requiredInviteCode);

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (isSignUp) {
        if (requiresInviteCode && inviteCode.trim() !== requiredInviteCode) {
          throw new Error('Codigo de convite invalido.');
        }

        const { error, data } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
        toast.success(t(locale, 'authSignUpSuccess') || 'Conta criada! Confirme seu email ou faca login se estiver habilitado diretamente.');
        if (data.session) onSession(data.session);
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
        if (data.session) onSession(data.session);
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col justify-center items-center p-4 font-body">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl border border-pink-100 animate-fade flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-gradient-to-tr from-pink-400 to-purple-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-200">
            <Heart className="w-8 h-8 fill-white animate-pulse" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-stone-800 font-heading">PersonalDiet</h1>
            <p className="text-xs text-stone-500 font-medium mt-1">
              Use o que voce tem na geladeira e economize dinheiro.
            </p>
          </div>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-heading font-bold text-stone-700 block mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full text-sm pl-10 pr-3 py-2.5 outline-none border border-stone-200 rounded-xl bg-stone-50 focus:border-pink-300 focus:bg-white transition-all font-medium"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-heading font-bold text-stone-700 block mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isSignUp ? 8 : undefined}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="w-full text-sm pl-10 pr-3 py-2.5 outline-none border border-stone-200 rounded-xl bg-stone-50 focus:border-pink-300 focus:bg-white transition-all font-medium"
                placeholder="********"
              />
            </div>
          </div>

          {isSignUp && requiresInviteCode && (
            <div>
              <label className="text-xs font-heading font-bold text-stone-700 block mb-1.5">Codigo de convite</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                  autoComplete="off"
                  className="w-full text-sm pl-10 pr-3 py-2.5 outline-none border border-stone-200 rounded-xl bg-stone-50 focus:border-pink-300 focus:bg-white transition-all font-medium"
                  placeholder="Codigo para testar"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-95 text-white rounded-xl shadow-md text-sm font-extrabold btn-interactive flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? 'Carregando...' : isSignUp ? 'Criar minha conta' : 'Entrar na minha conta'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="text-center border-t border-stone-100 pt-5">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-bold text-pink-500 hover:text-purple-500 transition-colors"
          >
            {isSignUp ? 'Ja tem uma conta? Faca login' : 'Ainda nao tem conta? Crie uma agora'}
          </button>
        </div>
      </div>
    </div>
  );
}
