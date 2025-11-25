'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from '@/hooks/useLocale';

export interface UserFormData {
  username: string;
  password: string;
  confirmPassword: string;
  role: 'student' | 'teacher' | 'admin';
  profileId: string;
}

export interface ValidationErrors {
  username?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
}

interface UserFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<UserFormData>;
  onDataChange: (data: UserFormData, isValid: boolean) => void;
}

export default function UserForm({
  mode,
  initialData,
  onDataChange,
}: UserFormProps) {
  const { t } = useLocale();

  const [formData, setFormData] = useState<UserFormData>({
    username: initialData?.username || '',
    password: initialData?.password || '',
    confirmPassword: '',
    role: initialData?.role || 'student',
    profileId: initialData?.profileId || '',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateForm = useCallback((): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = t.users.usernameRequired;
    } else if (formData.username.length > 50) {
      newErrors.username = t.users.usernameTooLong;
    }
    if (mode === 'create') {
      if (!formData.password) {
        newErrors.password = t.users.passwordRequired;
      } else if (formData.password.length < 6) {
        newErrors.password = t.users.passwordTooShort;
      }
      if (formData.password && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t.users.passwordMismatch;
      }
    } else {
      if (formData.password && formData.password.length < 6) {
        newErrors.password = t.users.passwordTooShort;
      }
      if (formData.password && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t.users.passwordMismatch;
      }
    }
    if (!formData.role) {
      newErrors.role = t.users.roleRequired;
    }
    return newErrors;
  }, [formData, mode, t.users]);

  const errors = validateForm();

  useEffect(() => {
    const isValid = Object.keys(errors).length === 0;
    onDataChange(formData, isValid);
  }, [formData, onDataChange, errors]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const showError = (field: keyof ValidationErrors) => {
    return touched[field] && errors[field];
  };

  return (
    <div className="space-y-4">
      {/* Username */}
      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm font-medium text-base-content/70">
            {t.users.username}
          </span>
          <span className="label-text-alt text-error">*</span>
        </label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          onBlur={() => handleBlur('username')}
          placeholder={t.users.usernamePlaceholder}
          className="input input-bordered bg-base-100/50 border-base-300/50 focus:border-primary/50 focus:outline-none transition-colors"
          maxLength={50}
          disabled={mode === 'edit'} 
          required={mode === 'create'}
        />
        {showError('username') && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.username}</span>
          </label>
        )}
        {mode === 'edit' && (
          <label className="label">
            <span className="label-text-alt text-base-content/50">
              {t.users.usernameCannotChange}
            </span>
          </label>
        )}
      </div>

      {/* Password */}
      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm font-medium text-base-content/70">
            {t.users.password}
          </span>
          {mode === 'create' && (
            <span className="label-text-alt text-error">*</span>
          )}
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          onBlur={() => handleBlur('password')}
          placeholder={t.users.passwordPlaceholder}
          className="input input-bordered bg-base-100/50 border-base-300/50 focus:border-primary/50 focus:outline-none transition-colors"
          minLength={6}
          required={mode === 'create'}
        />
        {showError('password') && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.password}</span>
          </label>
        )}
        {mode === 'edit' && (
          <label className="label">
            <span className="label-text-alt text-base-content/50">
              {t.users.passwordHint}
            </span>
          </label>
        )}
      </div>

      {/* Confirm Password */}
      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm font-medium text-base-content/70">
            {t.users.confirmPassword}
          </span>
          {mode === 'create' && (
            <span className="label-text-alt text-error">*</span>
          )}
        </label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={() => handleBlur('confirmPassword')}
          placeholder={t.users.confirmPasswordPlaceholder}
          className="input input-bordered bg-base-100/50 border-base-300/50 focus:border-primary/50 focus:outline-none transition-colors"
          required={mode === 'create'}
        />
        {showError('confirmPassword') && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.confirmPassword}
            </span>
          </label>
        )}
      </div>

      {/* Role */}
      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm font-medium text-base-content/70">
            {t.users.role}
          </span>
          <span className="label-text-alt text-error">*</span>
        </label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          onBlur={() => handleBlur('role')}
          className="select select-bordered bg-base-100/50 border-base-300/50 focus:border-primary/50 focus:outline-none transition-colors"
          required
        >
          <option value="student">{t.users.roleStudent}</option>
          <option value="teacher">{t.users.roleTeacher}</option>
          <option value="admin">{t.users.roleAdmin}</option>
        </select>
        {showError('role') && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.role}</span>
          </label>
        )}
      </div>

      {/* Profile ID (Optional) */}
      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm font-medium text-base-content/70">
            {t.users.profileId}
          </span>
          <span className="label-text-alt text-base-content/50">{t.users.optional}</span>
        </label>
        <input
          type="text"
          name="profileId"
          value={formData.profileId}
          onChange={handleChange}
          placeholder={t.users.profileIdPlaceholder}
          className="input input-bordered bg-base-100/50 border-base-300/50 focus:border-primary/50 focus:outline-none transition-colors"
        />
        <label className="label">
          <span className="label-text-alt text-base-content/50 text-xs">
            {t.users.profileIdHint}
          </span>
        </label>
      </div>
    </div>
  );
}
