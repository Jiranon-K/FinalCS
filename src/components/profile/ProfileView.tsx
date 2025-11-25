'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faIdCard, faEnvelope, faPhone, faBuilding, faGraduationCap, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import FaceUpdateRequestStatus from './FaceUpdateRequestStatus';
import FaceUpdateRequestForm from './FaceUpdateRequestForm';

export default function ProfileView() {
  const { user, refreshUser } = useAuth();
  const { t } = useLocale();
  const { showToast } = useToast();
  
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [isLoadingRequest, setIsLoadingRequest] = useState(true);
  const [isUploadingProfilePicture, setIsUploadingProfilePicture] = useState(false);

  const fetchActiveRequest = useCallback(async () => {
    try {
      const res = await fetch('/api/face-update-requests?status=pending');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setActiveRequest(data.data[0]);
      } else {
        const resAll = await fetch('/api/face-update-requests');
        const dataAll = await resAll.json();
        if (dataAll.success && dataAll.data.length > 0) {
           const latest = dataAll.data[0];
           if (latest.status === 'pending' || latest.status === 'rejected') {
             setActiveRequest(latest);
           } else {
             setActiveRequest(null);
           }
        } else {
          setActiveRequest(null);
        }
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

  const handleCancelRequest = async () => {
    if (!activeRequest) return;
    if (!confirm(t.register.confirmCancel)) return;

    try {
      const res = await fetch(`/api/face-update-requests/${activeRequest._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast({ message: t.profile.requestCancelled, type: 'success' });
        setActiveRequest(null);
        setShowUpdateForm(false);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      showToast({ message: t.profile.cancelError, type: 'error' });
    }
  };

  const handleRequestSuccess = () => {
    setShowUpdateForm(false);
    fetchActiveRequest();
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
    } catch (error) {
      showToast({ message: t.profile.profilePictureError, type: 'error' });
    } finally {
      setIsUploadingProfilePicture(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column: Profile Card */}
        <div className="w-full md:w-1/3 space-y-6">
          <div className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body items-center text-center">
              <div className="avatar mb-4">
                <div className="w-32 h-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 relative">
                  {user.imageUrl ? (
                    <Image
                      src={user.imageUrl}
                      alt="Profile"
                      fill
                      className="object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-base-300 flex items-center justify-center text-4xl font-bold text-base-content/30">
                      {user.username.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <h2 className="card-title text-2xl">{user.fullName || user.name}</h2>
              <p className="text-base-content/70 font-medium">{user.studentId}</p>
              <div className="badge badge-primary mt-2">{t.register.roleStudent}</div>

              {/* Profile Picture Upload Button */}
              <input
                type="file"
                id="profile-picture-upload"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePictureUpload}
              />

              <label
                htmlFor="profile-picture-upload"
                className="btn btn-primary btn-sm mt-4"
              >
                {isUploadingProfilePicture ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    {t.register.saving}
                  </>
                ) : (
                  t.profile.uploadProfilePicture
                )}
              </label>
            </div>
          </div>

          {/* Contact Info */}
          <div className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body p-6">
              <h3 className="font-bold text-lg mb-4 border-b pb-2">{t.profile.contactInfo}</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center text-primary">
                    <FontAwesomeIcon icon={faEnvelope} />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs text-base-content/60">{t.register.email}</div>
                    <div className="text-sm truncate" title={user.email}>{user.email || '-'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center text-primary">
                    <FontAwesomeIcon icon={faPhone} />
                  </div>
                  <div>
                    <div className="text-xs text-base-content/60">{t.register.phone}</div>
                    <div className="text-sm">{user.phone || '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Details & Actions */}
        <div className="w-full md:w-2/3 space-y-6">
          {/* Academic Info */}
          <div className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body">
              <h3 className="font-bold text-lg mb-4 border-b pb-2">{t.profile.academicInfo}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-primary"><FontAwesomeIcon icon={faBuilding} /></div>
                  <div>
                    <div className="text-xs text-base-content/60">{t.register.department}</div>
                    <div className="font-medium">{user.department || '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Face Update Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{t.profile.updateFace}</h3>
              {!showUpdateForm && !activeRequest && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowUpdateForm(true)}
                >
                  {t.profile.uploadNewFace}
                </button>
              )}
            </div>

            {isLoadingRequest ? (
              <div className="flex justify-center p-8">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : (
              <>
                {activeRequest && (
                  <FaceUpdateRequestStatus 
                    request={activeRequest} 
                    onCancel={handleCancelRequest}
                  />
                )}

                {showUpdateForm && !activeRequest && (
                  <FaceUpdateRequestForm 
                    onSuccess={handleRequestSuccess}
                    onCancel={() => setShowUpdateForm(false)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
