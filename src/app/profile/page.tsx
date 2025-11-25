'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/hooks/useLocale';
import ProfileView from '@/components/profile/ProfileView';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-base-100 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-base-content">{t.profile.title}</h1>
          <p className="text-base-content/60 mt-2">{t.profile.subtitle}</p>
        </div>
        
        <ProfileView />
      </div>
    </div>
  );
}
