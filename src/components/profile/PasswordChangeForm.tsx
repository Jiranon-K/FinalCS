'use client';

import { useState, useCallback } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

interface PasswordChangeFormProps {
  username: string;
  onSuccess: () => void;
}

interface ValidationErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function PasswordChangeForm({ username, onSuccess }: PasswordChangeFormProps) {
  const { t } = useLocale();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback((): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = t.profile.currentPasswordRequired;
    }

    if (!formData.newPassword) {
      newErrors.newPassword = t.profile.newPasswordRequired;
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = t.users.passwordTooShort;
    }

    if (formData.newPassword && formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = t.profile.passwordMustBeDifferent;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t.users.passwordMismatch;
    }

    return newErrors;
  }, [formData, t.profile, t.users]);

  const errors = validateForm();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({
      ...prev,
      [field]: true,
    }));
  };

  const showError = (field: keyof ValidationErrors) => {
    return touched[field] && errors[field];
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const clearForm = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setTouched({});
    setShowPasswords({
      current: false,
      new: false,
      confirm: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
    });

    // Validate
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      showToast({ message: t.profile.passwordChangeError, type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/users/${encodeURIComponent(username)}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Handle specific error messages from the server
        if (response.status === 401 && result.error) {
          throw new Error(t.profile.passwordIncorrect);
        }
        throw new Error(result.error || 'Failed to change password');
      }

      showToast({ message: t.profile.passwordChangeSuccess, type: 'success' });
      clearForm();
      onSuccess();
    } catch (error) {
      console.error('Password change error:', error);
      showToast({
        message: error instanceof Error ? error.message : t.profile.passwordChangeError,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Current Password */}
      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm font-medium text-base-content/70">
            {t.profile.currentPassword}
          </span>
          <span className="label-text-alt text-error">*</span>
        </label>
        <div className="relative">
          <input
            type={showPasswords.current ? 'text' : 'password'}
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            onBlur={() => handleBlur('currentPassword')}
            placeholder="••••••••"
            className={`input input-bordered w-full pr-10 bg-base-100/50 border-base-300/50 focus:border-primary/50 focus:outline-none transition-colors ${
              showError('currentPassword') ? 'input-error' : ''
            }`}
            disabled={isSubmitting}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors"
            onClick={() => togglePasswordVisibility('current')}
            disabled={isSubmitting}
          >
            <FontAwesomeIcon icon={showPasswords.current ? faEyeSlash : faEye} />
          </button>
        </div>
        {showError('currentPassword') && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.currentPassword}</span>
          </label>
        )}
      </div>

      {/* New Password */}
      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm font-medium text-base-content/70">
            {t.profile.newPassword}
          </span>
          <span className="label-text-alt text-error">*</span>
        </label>
        <div className="relative">
          <input
            type={showPasswords.new ? 'text' : 'password'}
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            onBlur={() => handleBlur('newPassword')}
            placeholder="••••••••"
            className={`input input-bordered w-full pr-10 bg-base-100/50 border-base-300/50 focus:border-primary/50 focus:outline-none transition-colors ${
              showError('newPassword') ? 'input-error' : ''
            }`}
            disabled={isSubmitting}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors"
            onClick={() => togglePasswordVisibility('new')}
            disabled={isSubmitting}
          >
            <FontAwesomeIcon icon={showPasswords.new ? faEyeSlash : faEye} />
          </button>
        </div>
        {showError('newPassword') && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.newPassword}</span>
          </label>
        )}
        <label className="label">
          <span className="label-text-alt text-base-content/50">
            {t.profile.passwordHint}
          </span>
        </label>
      </div>

      {/* Confirm Password */}
      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm font-medium text-base-content/70">
            {t.profile.confirmPassword}
          </span>
          <span className="label-text-alt text-error">*</span>
        </label>
        <div className="relative">
          <input
            type={showPasswords.confirm ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={() => handleBlur('confirmPassword')}
            placeholder="••••••••"
            className={`input input-bordered w-full pr-10 bg-base-100/50 border-base-300/50 focus:border-primary/50 focus:outline-none transition-colors ${
              showError('confirmPassword') ? 'input-error' : ''
            }`}
            disabled={isSubmitting}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors"
            onClick={() => togglePasswordVisibility('confirm')}
            disabled={isSubmitting}
          >
            <FontAwesomeIcon icon={showPasswords.confirm ? faEyeSlash : faEye} />
          </button>
        </div>
        {showError('confirmPassword') && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.confirmPassword}</span>
          </label>
        )}
      </div>

      {/* Submit Button */}
      <div className="form-control pt-2">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting || Object.keys(errors).length > 0}
        >
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              {t.register.saving}
            </>
          ) : (
            t.profile.changePassword
          )}
        </button>
      </div>
    </form>
  );
}
