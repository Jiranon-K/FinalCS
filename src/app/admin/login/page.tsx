'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/i18n/useLocale';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { refreshUser } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string; form?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { username?: string; password?: string } = {};

    if (!username.trim()) {
      newErrors.username = t.login.adminUsernameRequired;
    }
    if (!password.trim()) {
      newErrors.password = t.login.passwordRequired;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: 'admin' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ form: data.error || t.login.loginFailed });
      } else {
        // Refresh user data in AuthContext
        await refreshUser();
        router.push('/');
      }
    } catch (error) {
      setErrors({ form: t.login.loginError });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="hero min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-300/30 rounded-full blur-3xl animate-float opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-300/30 rounded-full blur-3xl animate-float-delayed opacity-50 pointer-events-none"></div>
      
      <div className="hero-content flex-col z-10">
        
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold tracking-wide uppercase mb-4 border border-purple-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
            {t.login.adminBadge}
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-900 to-indigo-900 drop-shadow-sm">
            {t.login.adminTitle}
          </h1>
          <p className="py-4 text-slate-500 opacity-0 animate-fade-in-up [animation-delay:200ms] [animation-fill-mode:forwards]">
            {t.login.adminSubtitle}
          </p>
        </div>
        
        <div className="card w-full max-w-sm shrink-0 shadow-2xl shadow-purple-900/10 bg-white/70 backdrop-blur-xl border border-white/60 opacity-0 animate-fade-in-up [animation-delay:400ms] [animation-fill-mode:forwards]">
          <div className="card-body p-8">
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label px-0">
                  <span className="label-text font-medium text-slate-600">{t.login.adminUsernameLabel}</span>
                </label>
                <input 
                  type="text" 
                  placeholder={t.login.adminUsernamePlaceholder} 
                  className={`input input-bordered w-full bg-white/50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:ring-4 transition-all duration-500 ${
                    errors.username 
                      ? 'input-error focus:border-error focus:ring-error/20' 
                      : 'focus:border-purple-600 focus:ring-purple-100'
                  }`}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors({ ...errors, username: undefined });
                  }}
                />
                {errors.username && (
                  <label className="label px-0 pt-1">
                    <span className="label-text-alt text-error">{errors.username}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label px-0">
                  <span className="label-text font-medium text-slate-600">{t.login.passwordLabel}</span>
                </label>
                <input 
                  type="password" 
                  placeholder={t.login.passwordPlaceholder}
                  className={`input input-bordered w-full bg-white/50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:ring-4 transition-all duration-500 ${
                    errors.password 
                      ? 'input-error focus:border-error focus:ring-error/20' 
                      : 'focus:border-purple-600 focus:ring-purple-100'
                  }`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                />
                {errors.password && (
                  <label className="label px-0 pt-1">
                    <span className="label-text-alt text-error">{errors.password}</span>
                  </label>
                )}
              </div>

              <div className="form-control mt-6">
                {errors.form && (
                  <div className="alert alert-error text-sm py-2 mb-4">
                    <span>{errors.form}</span>
                  </div>
                )}
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="btn border-none bg-gradient-to-r from-purple-800 to-indigo-900 text-white shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 hover:scale-[1.02] transition-all duration-500 w-full text-lg font-medium disabled:opacity-70 disabled:scale-100"
                >
                  {isLoading ? t.login.loading : t.login.adminLoginButton}
                </button>
              </div>
            </form>
            
            <div className="divider my-6 text-xs text-slate-400">{t.login.secureConnection}</div>
            
            <div className="text-center">
              <a href="/login" className="link link-hover text-sm text-slate-500 hover:text-purple-600 transition-colors duration-300">
                {t.login.backToGeneral}
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
