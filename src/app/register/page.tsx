'use client';

import { useLocale } from '@/hooks/useLocale';
import RegisterForm from '@/components/register/RegisterForm';

export default function RegisterPage() {
  const { t } = useLocale();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t.register.title}</h1>
        <p className="text-base-content/70">{t.register.subtitle}</p>
      </div>

      <RegisterForm />
    </div>
  );
}
