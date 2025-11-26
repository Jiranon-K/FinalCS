'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import ProfileSidebar from './ProfileSidebar';
import ProfileSection from './ProfileSection';
import ProfileStats from './ProfileStats';
import FaceUpdateRequestStatus from './FaceUpdateRequestStatus';
import FaceUpdateRequestForm from './FaceUpdateRequestForm';
import FaceRequestHistory from './FaceRequestHistory';
import ProfileEditForm from './ProfileEditForm';
import PasswordChangeForm from './PasswordChangeForm';

interface FaceUpdateRequest {
  _id: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  newImageUrl: string;
}

export default function ProfileView() {
  const { user, refreshUser } = useAuth();
  const { t } = useLocale();
  const { showToast } = useToast();
  
  const [pendingRequests, setPendingRequests] = useState<FaceUpdateRequest[]>([]);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingRequest, setIsLoadingRequest] = useState(true);
  const [isUploadingProfilePicture, setIsUploadingProfilePicture] = useState(false);
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  const fetchActiveRequest = useCallback(async () => {
    try {
      const res = await fetch('/api/face-update-requests?status=pending');
      const data = await res.json();
      if (data.success) {
        setPendingRequests(data.data);
      } else {
        setPendingRequests([]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoadingRequest(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveRequest();
  }, [fetchActiveRequest]);

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm(t.register.confirmCancel)) return;

    try {
      const res = await fetch(`/api/face-update-requests/${requestId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast({ message: t.profile.requestCancelled, type: 'success' });
        fetchActiveRequest();
      } else {
        throw new Error(data.error);
      }
    } catch {
      showToast({ message: t.profile.cancelError, type: 'error' });
    }
  };

  const handleRequestSuccess = () => {
    setShowUpdateForm(false);
    fetchActiveRequest();
  };

  const handleProfileUpdateSuccess = async () => {
    await refreshUser();
    setProfileUpdateSuccess(true);
    setTimeout(() => setProfileUpdateSuccess(false), 3000);
  };

  const handlePasswordChangeSuccess = () => {
    setPasswordChangeSuccess(true);
    setTimeout(() => setPasswordChangeSuccess(false), 3000);
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingProfilePicture(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageData = reader.result as string;

        const res = await fetch(`/api/users/${user?.username}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData }),
        });

        const data = await res.json();
        if (data.success) {
          showToast({ message: t.profile.profilePictureUpdated, type: 'success' });
          await refreshUser();
        } else {
          throw new Error(data.error);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      showToast({ message: t.profile.profilePictureError, type: 'error' });
    } finally {
      setIsUploadingProfilePicture(false);
    }
  };

  if (!user) return null;

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="mb-6">
        <ProfileStats />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <ProfileSidebar
          onUploadProfilePicture={handleProfilePictureUpload}
          isUploading={isUploadingProfilePicture}
          hasPendingRequest={pendingRequests.length > 0}
          onRequestUpdate={() => setShowUpdateForm(true)}
          onViewHistory={() => setShowHistory(true)}
        />

        <div className="flex-1 space-y-6">
          <ProfileSection
            title={t.profile.personalInfo}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                }
                label={t.register.name}
                value={user.fullName || user.name || '-'}
              />
              <InfoItem
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
                  </svg>
                }
                label={t.register.studentId}
                value={user.studentId || '-'}
              />
            </div>
          </ProfileSection>

          <ProfileSection
            title={t.profile.contactInfo}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                }
                label={t.register.email}
                value={user.email || '-'}
              />
              <InfoItem
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                }
                label={t.register.phone}
                value={user.phone || '-'}
              />
            </div>
          </ProfileSection>

          <ProfileSection
            title={t.profile.academicInfo}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
              </svg>
            }
          >
            <InfoItem
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                </svg>
              }
              label={t.register.department}
              value={user.department || '-'}
            />
          </ProfileSection>

          <ProfileSection
            title={t.profile.editProfile}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
            }
            isCollapsible={true}
            defaultOpen={false}
          >
            {profileUpdateSuccess && (
              <div className="alert alert-success mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t.profile.updateSuccess}</span>
              </div>
            )}
            <ProfileEditForm
              initialData={{
                name: user.name || '',
                email: user.email,
                phone: user.phone,
                department: user.department,
                studentId: user.studentId,
              }}
              profileId={user.profileId || ''}
              onSuccess={handleProfileUpdateSuccess}
            />
          </ProfileSection>

          <ProfileSection
            title={t.profile.changePassword}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            }
            isCollapsible={true}
            defaultOpen={false}
          >
            {passwordChangeSuccess && (
              <div className="alert alert-success mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t.profile.passwordChangeSuccess}</span>
              </div>
            )}
            <PasswordChangeForm
              username={user.username}
              onSuccess={handlePasswordChangeSuccess}
            />
          </ProfileSection>

          <ProfileSection
            title={t.profile.faceUpdateRequest}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
            }
          >
            {isLoadingRequest ? (
              <div className="flex justify-center p-8">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            ) : (
              <>
                {pendingRequests.map((request) => (
                  <div key={request._id} className="mb-6">
                    <FaceUpdateRequestStatus 
                      request={request} 
                      onCancel={() => handleCancelRequest(request._id)}
                    />
                  </div>
                ))}

                {showUpdateForm && (
                  <FaceUpdateRequestForm 
                    onSuccess={handleRequestSuccess}
                    onCancel={() => setShowUpdateForm(false)}
                  />
                )}

                {!showUpdateForm && (
                  <div className="text-center py-6">
                    {pendingRequests.length === 0 && (
                      <div className="flex flex-col items-center gap-3 mb-4">
                        <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-base-content/40">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                          </svg>
                        </div>
                        <p className="text-base-content/60">{t.profile.noActiveRequest}</p>
                      </div>
                    )}
                    <button
                      onClick={() => setShowUpdateForm(true)}
                      className="btn btn-primary gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      {t.profile.submitNewFace}
                    </button>
                  </div>
                )}
              </>
            )}
          </ProfileSection>
        </div>
      </div>

      <FaceRequestHistory 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
      />
    </div>
  );
}

function InfoItem({ 
  icon, 
  label, 
  value 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-base-200/50 hover:bg-base-200 transition-colors duration-200">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-base-content/50 font-medium">{label}</div>
        <div className="text-sm font-semibold text-base-content truncate">{value}</div>
      </div>
    </div>
  );
}
