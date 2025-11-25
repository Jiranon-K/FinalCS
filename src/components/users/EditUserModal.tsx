'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import Image from 'next/image';
import { User } from './UserTable';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
}

type UserRole = 'student' | 'teacher' | 'admin';

// Minimal SVG Icons
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

const TeacherIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
  </svg>
);

const UserPlaceholderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

export default function EditUserModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: EditUserModalProps) {
  const { t } = useLocale();
  const { showToast } = useToast();
  
  // Form state
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [studentId, setStudentId] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isImageRemoved, setIsImageRemoved] = useState(false);
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && user) {
        fetchUserDetails(user._id);
    }
  }, [isOpen, user]);

  const fetchUserDetails = async (id: string) => {
      try {
          const res = await fetch(`/api/users/${id}`);
          const json = await res.json();
          if (json.success) {
              const u = json.data;
              setEmail(u.username);
              setFullName(u.fullName || '');
              setRole(u.role);
              setStudentId(u.studentId || '');
              setImagePreview(u.imageUrl || null);
              setIsImageRemoved(false);
          } else {
              showToast({ message: 'Failed to fetch user details', type: 'error' });
          }
      } catch (err) {
          console.error(err);
          showToast({ message: 'Failed to fetch user details', type: 'error' });
      }
  }

  const resetForm = () => {
    setEmail('');
    setFullName('');
    setPassword('');
    setRole('student');
    setStudentId('');
    setImagePreview(null);
    setImageFile(null);
    setIsImageRemoved(false);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = t.users.usernameRequired;
    }

    if (password && password.length < 6) {
        newErrors.password = t.users.passwordTooShort;
    }

    if (role === 'student' && !studentId.trim()) {
      newErrors.studentId = t.users.studentIdRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast({ message: t.users.invalidImageType, type: 'error' });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showToast({ message: t.users.imageTooLarge, type: 'error' });
      return;
    }

    setImageFile(file);
    setIsImageRemoved(false);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setIsImageRemoved(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!validateForm()) return;

    try {
      setSaving(true);

      let imageData: string | undefined;
      if (imageFile) {
        imageData = await convertFileToBase64(imageFile);
      }

      const updateData: {
        fullName: string;
        role: UserRole;
        password?: string;
        studentId?: string;
        imageData?: string;
        removeImage?: boolean;
      } = {
          fullName: fullName.trim(),
          role,
          removeImage: isImageRemoved && !imageData,
      };

      if (password) {
          updateData.password = password;
      }

      if (role === 'student') {
          updateData.studentId = studentId.trim();
      }

      if (imageData) {
          updateData.imageData = imageData;
      }

      const response = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success) {
        showToast({ message: t.users.updateSuccess || 'User updated successfully', type: 'success' });
        resetForm();
        onSuccess();
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showToast({
        message: error instanceof Error ? error.message : t.users.updateError || 'Failed to update user',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const roleConfig = {
    student: { icon: <UserIcon />, activeColor: 'bg-info text-info-content border-info' },
    teacher: { icon: <TeacherIcon />, activeColor: 'bg-success text-success-content border-success' },
    admin: { icon: <ShieldIcon />, activeColor: 'bg-error text-error-content border-error' },
  };

  const roleLabels = {
    student: t.users.roleStudent,
    teacher: t.users.roleTeacher,
    admin: t.users.roleAdmin,
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-lg p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-base-200 flex items-center justify-between">
          <h3 className="font-semibold text-lg">{t.users.edit || 'Edit User'}</h3>
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={handleClose}
            disabled={saving}
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex flex-col items-center">
            <div 
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-24 h-24 rounded-full bg-base-200 flex items-center justify-center overflow-hidden ring-4 ring-base-100 shadow-lg">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="text-base-content/20">
                    <UserPlaceholderIcon />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <CameraIcon />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
                disabled={saving}
              />
            </div>
            {imagePreview && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="btn btn-ghost btn-xs mt-2 text-error"
                disabled={saving}
              >
                {t.users.removeProfileImage}
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['student', 'teacher', 'admin'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                  role === r 
                    ? roleConfig[r].activeColor + ' shadow-md' 
                    : 'border-base-200 hover:border-base-300'
                }`}
                onClick={() => setRole(r)}
              >
                {roleConfig[r].icon}
                <span className="text-xs font-medium">{roleLabels[r]}</span>
              </button>
            ))}
          </div>

          {role === 'student' && (
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-sm font-medium">{t.users.studentId}</span>
              </label>
              <input
                type="text"
                className={`input input-bordered w-full ${errors.studentId ? 'input-error' : ''}`}
                placeholder={t.users.studentIdPlaceholder || "Enter Student ID"}
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                maxLength={20}
                disabled={saving}
              />
              {errors.studentId && (
                <p className="text-xs text-error mt-1">{errors.studentId}</p>
              )}
            </div>
          )}

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-sm font-medium">{t.register.name}</span>
            </label>
            <input
              type="text"
              className={`input input-bordered w-full ${errors.fullName ? 'input-error' : ''}`}
              placeholder={t.register.namePlaceholder}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={100}
              disabled={saving}
            />
            {errors.fullName && (
              <p className="text-xs text-error mt-1">{errors.fullName}</p>
            )}
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-sm font-medium">{t.users.email}</span>
            </label>
            <input
              type="email"
              className="input input-bordered w-full bg-base-200"
              value={email}
              disabled
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="btn btn-ghost flex-1"
              onClick={handleClose}
              disabled={saving}
            >
              {t.users.cancel}
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  {t.users.saving}
                </>
              ) : (
                t.users.save
              )}
            </button>
          </div>
        </form>
      </div>

      <form method="dialog" className="modal-backdrop bg-black/50">
        <button onClick={handleClose} disabled={saving}>close</button>
      </form>
    </dialog>
  );
}
