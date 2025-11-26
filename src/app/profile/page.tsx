'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProfileView from '@/components/profile/ProfileView';
import ProfileHeader from '@/components/profile/ProfileHeader';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="w-full h-full flex flex-col bg-base-100/30">
      <ProfileHeader />
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <ProfileView />
      </div>
    </div>
  );
}
