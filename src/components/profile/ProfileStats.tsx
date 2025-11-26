'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/hooks/useLocale';

export default function ProfileStats() {
  const { user } = useAuth();
  const { t } = useLocale();

  if (!user) return null;

  const accountAge = user.createdAt ? calculateAccountAge(user.createdAt) : '-';

  return (
    <div className="stats stats-vertical lg:stats-horizontal shadow-md w-full bg-base-100">
      <div className="stat">
        <div className="stat-figure text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>
        <div className="stat-title text-xs">{t.profile.faceRecognitionStatus}</div>
        <div className="stat-value text-lg">
          {user.faceDescriptorCount || 0}
        </div>
        <div className="stat-desc">Face Descriptors</div>
      </div>
      
      <div className="stat">
        <div className="stat-figure text-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        </div>
        <div className="stat-title text-xs">{t.profile.accountCreated}</div>
        <div className="stat-value text-lg">{accountAge}</div>
        <div className="stat-desc">Days Active</div>
      </div>
      
      <div className="stat">
        <div className="stat-figure text-accent">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <div className="stat-title text-xs">{t.profile.status}</div>
        <div className="stat-value text-lg">
          {user.hasProfileRegistered ? (
            <span className="text-success">Active</span>
          ) : (
            <span className="text-warning">Pending</span>
          )}
        </div>
        <div className="stat-desc">Account Status</div>
      </div>
    </div>
  );
}

function calculateAccountAge(dateStr: string): string {
  const created = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays.toString();
}
