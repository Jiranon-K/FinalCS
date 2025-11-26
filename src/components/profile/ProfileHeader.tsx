'use client';

import { useLocale } from '@/hooks/useLocale';

export default function ProfileHeader() {
  const { t } = useLocale();

  return (
    <div className="bg-linear-to-r from-primary/10 via-primary/5 to-transparent border-b border-base-100 px-4 lg:px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className="w-6 h-6 text-primary"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" 
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-base-content">
            {t.profile.title}
          </h1>
          <p className="text-sm text-base-content/60 mt-0.5">
            {t.profile.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
