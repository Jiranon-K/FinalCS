'use client';

import { useLocale } from '@/hooks/useLocale';
import RegisterForm from '@/components/register/RegisterForm';

export default function RegisterPage() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen w-full px-8 py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">{t.register.title}</h1>
          <p className="text-lg text-base-content/60">{t.register.subtitle}</p>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
}
