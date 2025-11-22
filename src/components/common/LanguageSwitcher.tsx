'use client';

import { useLocale } from '@/i18n/useLocale';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="join">
      <input
        className="join-item btn btn-sm btn-ghost data-[checked=true]:bg-purple-100 data-[checked=true]:text-purple-700"
        type="radio"
        name="options"
        aria-label="TH"
        checked={locale === 'th'}
        onChange={() => setLocale('th')}
        data-checked={locale === 'th'}
      />
      <input
        className="join-item btn btn-sm btn-ghost data-[checked=true]:bg-purple-100 data-[checked=true]:text-purple-700"
        type="radio"
        name="options"
        aria-label="EN"
        checked={locale === 'en'}
        onChange={() => setLocale('en')}
        data-checked={locale === 'en'}
      />
    </div>
  );
}
