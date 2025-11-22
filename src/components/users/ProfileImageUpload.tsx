'use client';

import { useState, useRef } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faTrash, faImage } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

interface ProfileImageUploadProps {
  onImageChange: (imageData: string | null) => void;
  currentImage: string | null;
  username?: string;
}

export default function ProfileImageUpload({
  onImageChange,
  currentImage,
  username = 'User',
}: ProfileImageUploadProps) {
  const { t } = useLocale();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const validateImage = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast({
        message: t.users.invalidImageType,
        type: 'error',
      });
      return false;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast({
        message: t.users.imageTooLarge,
        type: 'error',
      });
      return false;
    }
    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateImage(file)) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      onImageChange(base64String);
      setIsProcessing(false);
      showToast({
        message: t.users.imageLoadedSuccess,
        type: 'success',
      });
    };
    reader.onerror = () => {
      showToast({
        message: t.users.imageLoadFailed,
        type: 'error',
      });
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast({
      message: t.users.imageRemoved,
      type: 'info',
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const getInitials = () => {
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* Label */}
      <div>
        <label className="label">
          <span className="label-text text-sm font-medium text-base-content/70">
            {t.users.profileImage}
          </span>
        </label>
        <p className="text-xs text-base-content/50 mt-1">
          {t.users.defaultImageInfo}
        </p>
      </div>

      {/* Image Preview */}
      <div className="flex items-center gap-6">
        {/* Avatar Preview */}
        <div className="avatar">
          <div className="w-24 h-24 rounded-full ring-2 ring-base-300 ring-offset-2 ring-offset-base-100">
            {currentImage ? (
              <Image
                src={currentImage}
                alt="Profile preview"
                className="object-cover w-full h-full rounded-full"
              />
            ) : (
              <div className="bg-linear-to-br from-primary/80 to-primary text-primary-content w-full h-full flex items-center justify-center font-bold text-2xl">
                {getInitials()}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Upload/Change Button */}
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={isProcessing}
            className="btn btn-sm btn-outline gap-2"
          >
            {isProcessing ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                {t.users.processing}
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={currentImage ? faImage : faUpload} />
                {currentImage ? t.users.changeProfileImage : t.users.uploadProfileImage}
              </>
            )}
          </button>

          {/* Remove Button */}
          {currentImage && (
            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={isProcessing}
              className="btn btn-sm btn-ghost text-error hover:bg-error/10 gap-2"
            >
              <FontAwesomeIcon icon={faTrash} />
              {t.users.removeProfileImage}
            </button>
          )}
        </div>
      </div>

      {/* Helper Text */}
      <div className="text-xs text-base-content/50">
        <p>{t.users.acceptedFormats}</p>
        <p>{t.users.maxFileSize}</p>
      </div>
    </div>
  );
}
