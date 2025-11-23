'use client';

import { useState } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import FaceUpload from './FaceUpload';

type PersonRole = 'student' | 'teacher';

interface FormData {
  name: string;
  studentId: string;
  email: string;
  phone: string;
  role: PersonRole;
  department: string;
  grade: string;
  class: string;
}

export default function RegisterForm() {
  const { t } = useLocale();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [faceImagePreview, setFaceImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    studentId: '',
    email: '',
    phone: '',
    role: 'student',
    department: '',
    grade: '',
    class: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFaceDetected = (imageFile: File, descriptor: number[]) => {
    setFaceDescriptor(descriptor);

    const reader = new FileReader();
    reader.onloadend = () => {
      setFaceImagePreview(reader.result as string);
    };
    reader.readAsDataURL(imageFile);
  };

  const handleImageRemove = () => {
    setFaceDescriptor(null);
    setFaceImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast({ message: t.toasts.validationError, type: 'error' });
      return;
    }

    if (!faceDescriptor || !faceImagePreview) {
      showToast({ message: t.register.imageRequired, type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const apiEndpoint = formData.role === 'student' ? '/api/students' : '/api/teachers';

      const requestBody = {
        name: formData.name,
        ...(formData.role === 'student'
          ? { studentId: formData.studentId, grade: formData.grade, class: formData.class }
          : { teacherId: formData.studentId }
        ),
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        faceDescriptor,
        imageData: faceImagePreview,
      };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to register');
      }

      showToast({ message: t.register.success, type: 'success' });

      setFormData({
        name: '',
        studentId: '',
        email: '',
        phone: '',
        role: 'student',
        department: '',
        grade: '',
        class: '',
      });
      handleImageRemove();

    } catch (error) {
      console.error('Registration error:', error);
      showToast({
        message: error instanceof Error ? error.message : t.register.error,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm(t.register.confirmCancel)) {
      setFormData({
        name: '',
        studentId: '',
        email: '',
        phone: '',
        role: 'student',
        department: '',
        grade: '',
        class: '',
      });
      handleImageRemove();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">{t.register.personalInfo}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t.register.name}</span>
                <span className="label-text-alt text-error">*</span>
              </label>
              <input
                type="text"
                name="name"
                maxLength={100}
                value={formData.name}
                onChange={handleInputChange}
                placeholder={t.register.namePlaceholder}
                className="input input-bordered w-full"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t.register.studentId}</span>
              </label>
              <input
                type="text"
                name="studentId"
                maxLength={20}
                value={formData.studentId}
                onChange={handleInputChange}
                placeholder={t.register.studentIdPlaceholder}
                className="input input-bordered w-full"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t.register.email}</span>
              </label>
              <input
                type="email"
                name="email"
                maxLength={100}
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t.register.emailPlaceholder}
                className="input input-bordered w-full"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t.register.phone}</span>
              </label>
              <input
                type="tel"
                name="phone"
                maxLength={15}
                value={formData.phone}
                onChange={handleInputChange}
                placeholder={t.register.phonePlaceholder}
                className="input input-bordered w-full"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t.register.role}</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="select select-bordered w-full"
              >
                <option value="student">{t.register.roleStudent}</option>
                <option value="teacher">{t.register.roleTeacher}</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t.register.department}</span>
              </label>
              <input
                type="text"
                name="department"
                maxLength={100}
                value={formData.department}
                onChange={handleInputChange}
                placeholder={t.register.departmentPlaceholder}
                className="input input-bordered w-full"
              />
            </div>

            {formData.role === 'student' && (
              <>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t.register.grade}</span>
                  </label>
                  <input
                    type="text"
                    name="grade"
                    maxLength={20}
                    value={formData.grade}
                    onChange={handleInputChange}
                    placeholder={t.register.gradePlaceholder}
                    className="input input-bordered w-full"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t.register.class}</span>
                  </label>
                  <input
                    type="text"
                    name="class"
                    maxLength={20}
                    value={formData.class}
                    onChange={handleInputChange}
                    placeholder={t.register.classPlaceholder}
                    className="input input-bordered w-full"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">
            {t.register.faceImage}
            <span className="text-error ml-2">*</span>
          </h2>

          <FaceUpload
            onFaceDetected={handleFaceDetected}
            onImageRemove={handleImageRemove}
            currentImage={faceImagePreview}
          />
        </div>
      </div>

      <div className="flex gap-4 justify-end">
        <button
          type="button"
          onClick={handleCancel}
          className="btn btn-outline"
          disabled={isSubmitting}
        >
          {t.register.cancel}
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting || !formData.name.trim() || !faceDescriptor}
        >
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner"></span>
              {t.register.saving}
            </>
          ) : (
            t.register.submit
          )}
        </button>
      </div>
    </form>
  );
}
