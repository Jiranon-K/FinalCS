'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';

interface ProfileEditFormProps {
  initialData: {
    name: string;
    email?: string;
    phone?: string;
    department?: string;
    studentId?: string;
  };
  profileId: string;
  onSuccess: () => void;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
}

export default function ProfileEditForm({ initialData, profileId, onSuccess }: ProfileEditFormProps) {
  const { refreshUser } = useAuth();
  const { t } = useLocale();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: initialData.name || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    department: initialData.department || '',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback((): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t.profile.nameRequired;
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t.profile.emailInvalid;
    }

    if (formData.phone.trim() && !/^[0-9\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = t.profile.phoneInvalid;
    }

    return newErrors;
  }, [formData, t.profile]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      phone: true,
    });

    // Validate
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      showToast({ message: t.profile.updateError, type: 'error' });
      return;
    }

    if (!profileId) {
      showToast({ message: t.profile.updateError, type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/students/${profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          department: formData.department.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }

      showToast({ message: t.profile.updateSuccess, type: 'success' });
      await refreshUser();
      onSuccess();
    } catch (error) {
      console.error('Profile update error:', error);
      showToast({
        message: error instanceof Error ? error.message : t.profile.updateError,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Student ID (Read-only) */}
      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm font-medium text-base-content/70">
            {t.users.studentId}
          </span>
        </label>
        <input
          type="text"
          value={initialData.studentId || '-'}
          disabled
          className="input input-bordered bg-base-200/50 text-base-content/60 cursor-not-allowed"
        />
        <label className="label">
          <span className="label-text-alt text-base-content/50">
            {t.profile.studentIdReadOnly}
          </span>
        </label>
      </div>

      {/* Name */}
      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm font-medium text-base-content/70">
            {t.register.name}
          </span>
          <span className="label-text-alt text-error">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          onBlur={() => handleBlur('name')}
          placeholder={t.register.namePlaceholder}
          className={`input input-bordered bg-base-100/50 border-base-300/50 focus:border-primary/50 focus:outline-none transition-colors ${
            showError('name') ? 'input-error' : ''
          }`}
          disabled={isSubmitting}
        />
        {showError('name') && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.name}</span>
          </label>
        )}
      </div>

      {/* Email */}
      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm font-medium text-base-content/70">
            {t.register.email}
          </span>
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={() => handleBlur('email')}
          placeholder={t.register.emailPlaceholder}
          className={`input input-bordered bg-base-100/50 border-base-300/50 focus:border-primary/50 focus:outline-none transition-colors ${
            showError('email') ? 'input-error' : ''
          }`}
          disabled={isSubmitting}
        />
        {showError('email') && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.email}</span>
          </label>
        )}
      </div>

      {/* Phone */}
      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm font-medium text-base-content/70">
            {t.register.phone}
          </span>
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          onBlur={() => handleBlur('phone')}
          placeholder={t.register.phonePlaceholder}
          className={`input input-bordered bg-base-100/50 border-base-300/50 focus:border-primary/50 focus:outline-none transition-colors ${
            showError('phone') ? 'input-error' : ''
          }`}
          disabled={isSubmitting}
        />
        {showError('phone') && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.phone}</span>
          </label>
        )}
      </div>

      {/* Department */}
      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm font-medium text-base-content/70">
            {t.register.department}
          </span>
        </label>
        <input
          type="text"
          name="department"
          value={formData.department}
          onChange={handleChange}
          placeholder={t.register.departmentPlaceholder}
          className="input input-bordered bg-base-100/50 border-base-300/50 focus:border-primary/50 focus:outline-none transition-colors"
          disabled={isSubmitting}
        />
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
            t.profile.saveChanges || t.register.submit
          )}
        </button>
      </div>
    </form>
  );
}
