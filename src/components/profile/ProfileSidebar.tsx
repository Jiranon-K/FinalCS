'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/hooks/useLocale';
import Image from 'next/image';
import { useRef } from 'react';

interface ProfileSidebarProps {
  onUploadProfilePicture: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  hasPendingRequest: boolean;
  onRequestUpdate: () => void;
  onViewHistory: () => void;
}

export default function ProfileSidebar({
  onUploadProfilePicture,
  isUploading,
  hasPendingRequest,
  onRequestUpdate,
  onViewHistory,
}: ProfileSidebarProps) {
  const { user } = useAuth();
  const { t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const completionPercentage = calculateProfileCompletion(user);

  return (
    <div className="w-full lg:w-80 space-y-4">
      <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow duration-300">
        <div className="card-body items-center text-center p-6">
          <div className="relative group">
            <div className="avatar">
              <div className="w-28 h-28 rounded-full ring-4 ring-primary/20 ring-offset-base-100 ring-offset-2 relative overflow-hidden">
                {user.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-4xl font-bold text-primary">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-0 right-0 btn btn-circle btn-sm btn-primary shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              {isUploading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onUploadProfilePicture}
            />
          </div>

          <div className="mt-4 space-y-1">
            <h2 className="text-xl font-bold text-base-content">
              {user.fullName || user.name || user.username}
            </h2>
            {user.studentId && (
              <p className="text-sm text-base-content/60 font-medium">
                {user.studentId}
              </p>
            )}
            <div className="badge badge-primary badge-sm mt-2">
              {user.role === 'student' ? t.register.roleStudent : 
               user.role === 'teacher' ? t.register.roleTeacher : t.register.roleAdmin}
            </div>
          </div>

          <div className="divider my-4"></div>

          <div className="w-full">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-base-content/60">Profile Completion</span>
              <span className="font-semibold text-primary">{completionPercentage}%</span>
            </div>
            <progress 
              className="progress progress-primary w-full h-2" 
              value={completionPercentage} 
              max="100"
            ></progress>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow duration-300">
        <div className="card-body p-4">
          <h3 className="font-semibold text-sm flex items-center gap-2 text-base-content/80">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            {t.profile.faceRecognitionStatus}
          </h3>
          
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-base-content/60">{t.profile.status}</span>
              {user.hasProfileRegistered ? (
                <div className="badge badge-success badge-sm gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  {t.profile.faceRegistered}
                </div>
              ) : ( 
                <div className="badge badge-warning badge-sm gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  Not Registered
                </div>
              )}
            </div>
            
            {user.faceDescriptorCount && user.faceDescriptorCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-base-content/60">Face Data</span>
                <span className="text-sm font-medium">{user.faceDescriptorCount} descriptor(s)</span>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <button
              onClick={onRequestUpdate}
              disabled={hasPendingRequest}
              className="btn btn-primary btn-sm w-full gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              {hasPendingRequest ? t.profile.requestPending : t.profile.updateFace}
            </button>
            <button
              onClick={onViewHistory}
              className="btn btn-ghost btn-sm w-full gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              View History
            </button>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow duration-300">
        <div className="card-body p-4">
          <h3 className="font-semibold text-sm flex items-center gap-2 text-base-content/80">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            {t.profile.accountInfo}
          </h3>
          
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-base-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-base-content/60">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-base-content/50">Username</div>
                <div className="text-sm font-medium truncate">{user.username}</div>
              </div>
            </div>
            
            {user.createdAt && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-base-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-base-content/60">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-base-content/50">{t.profile.accountCreated}</div>
                  <div className="text-sm font-medium">{formatDate(user.createdAt)}</div>
                </div>
              </div>
            )}
            
            {user.lastLogin && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-base-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-base-content/60">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-base-content/50">{t.profile.lastLogin}</div>
                  <div className="text-sm font-medium">{formatDate(user.lastLogin)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateProfileCompletion(user: {
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  department?: string;
  imageUrl?: string;
  hasProfileRegistered?: boolean;
}): number {
  const fields = [
    user.name || user.fullName,
    user.email,
    user.phone,
    user.department,
    user.imageUrl,
    user.hasProfileRegistered,
  ];
  const completed = fields.filter(Boolean).length;
  return Math.round((completed / fields.length) * 100);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
