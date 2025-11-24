'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/i18n/useLocale';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'student' | 'teacher'>('student');
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
      newErrors.username = t.login.usernameRequired; 
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
        body: JSON.stringify({ username, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ form: data.error || t.login.loginFailed });
      } else {
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

      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/40 rounded-full blur-3xl animate-float opacity-60 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/40 rounded-full blur-3xl animate-float-delayed opacity-60 pointer-events-none"></div>
      <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-pink-100/40 rounded-full blur-3xl animate-pulse-slow opacity-40 pointer-events-none"></div>

      <div className="hero-content flex-col lg:flex-row-reverse gap-12 lg:gap-20 z-10">
        
        <div className="text-center lg:text-left max-w-md animate-fade-in-up">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-4 drop-shadow-sm">
            {t.login.welcome}
          </h1>
          <p className="py-6 text-slate-600 text-lg leading-relaxed opacity-0 animate-fade-in-up [animation-delay:200ms] [animation-fill-mode:forwards]">
            {t.login.subtitle}
          </p>
        </div>
        
        <div className="card w-full max-w-sm shrink-0 shadow-2xl shadow-purple-500/10 bg-white/70 backdrop-blur-xl border border-white/60 opacity-0 animate-fade-in-up [animation-delay:400ms] [animation-fill-mode:forwards]">
          <div className="card-body p-8">
            
            <div className="form-control mb-6">
              <label className="label px-0">
                <span className="label-text font-semibold text-slate-500">{t.login.selectRole}</span>
              </label>
              <div className="join w-full p-1 bg-slate-100/50 rounded-lg border border-slate-200/60">
                <button
                  type="button"
                  className={`join-item btn flex-1 border-none shadow-none text-sm transition-all duration-500 ${
                    role === 'student' 
                      ? 'bg-white text-purple-600 shadow-sm font-bold' 
                      : 'bg-transparent text-slate-400 hover:text-slate-600'
                  }`}
                  onClick={() => setRole('student')}
                >
                  {t.login.roleStudent}
                </button>
                <button
                  type="button"
                  className={`join-item btn flex-1 border-none shadow-none text-sm transition-all duration-500 ${
                    role === 'teacher' 
                      ? 'bg-white text-purple-600 shadow-sm font-bold' 
                      : 'bg-transparent text-slate-400 hover:text-slate-600'
                  }`}
                  onClick={() => setRole('teacher')}
                >
                  {t.login.roleTeacher}
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label px-0">
                  <span className="label-text font-medium text-slate-600">{t.login.usernamePlaceholder}</span>
                </label>
                <input 
                  type="email" 
                  placeholder={t.login.usernamePlaceholderEmail} 
                  className={`input input-bordered w-full bg-white/50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:ring-4 transition-all duration-500 ${
                    errors.username 
                      ? 'input-error focus:border-error focus:ring-error/20' 
                      : 'focus:border-purple-400 focus:ring-purple-100'
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
                      : 'focus:border-purple-400 focus:ring-purple-100'
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
                <label className="label px-0 pt-3">
                  <a href="#" className="label-text-alt link link-hover text-purple-500 hover:text-purple-600 transition-colors duration-300">{t.login.forgotPassword}</a>
                </label>
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
                  className="btn border-none bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] transition-all duration-500 w-full text-lg font-medium disabled:opacity-70 disabled:scale-100"
                >
                  {isLoading ? t.login.loading : t.login.loginButton}
                </button>
              </div>
            </form>
            
          </div>
        </div>
      </div>
    </div>
  );
}
