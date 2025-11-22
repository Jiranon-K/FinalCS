'use client';

import { useLocale } from "@/i18n/useLocale";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import Loading from "@/components/ui/Loading";

const languages = [
  { code: 'th' as const, name: 'ไทย', flag: '🇹🇭' },
  { code: 'en' as const, name: 'English', flag: '🇺🇸' },
];

export default function LanguageSelector() {
  const { locale, setLocale, t } = useLocale();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <Loading variant="dots" size="sm" />;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-base-content mb-2">
        {t.settings.selectLanguage}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className={`btn btn-outline justify-start gap-3 ${
              locale === lang.code ? 'btn-primary' : ''
            }`}
          >
            <span className="text-2xl">{lang.flag}</span>
            <span className="flex-1 text-left">{lang.name}</span>
            {locale === lang.code && (
              <FontAwesomeIcon icon={faCheck} className="text-lg" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
