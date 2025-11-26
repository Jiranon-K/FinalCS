'use client';

import { useState } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import FaceUpload from './FaceUpload';

type PersonRole = 'student' | 'teacher';

interface FormData {
  name: string;
  studentId: string;
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
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    studentId: '',
    phone: '',
    role: 'student',
    department: '',
    grade: '',
    class: '',
  });

  // Pre-fill
  useState(() => {
    if (user && user.role === 'student') {
      setFormData(prev => ({
        ...prev,
        name: user.fullName || prev.name,
        studentId: user.studentId || prev.studentId,
        role: 'student'
      }));
    }
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

      // Redirect to home page and reload to update user session
      window.location.href = '/';

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
    <form onSubmit={handleSubmit} className="space-y-10">
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">{t.register.personalInfo}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                className="input input-bordered w-full input-lg"
                required
                disabled={user?.role === 'student' && !!user.fullName}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t.register.studentId}</span>
                <span className="label-text-alt text-error">*</span>
              </label>
              <input
                type="text"
                name="studentId"
                maxLength={20}
                value={formData.studentId}
                onChange={handleInputChange}
                placeholder={t.register.studentIdPlaceholder}
                className="input input-bordered w-full input-lg"
                required
                disabled={user?.role === 'student' && !!user.studentId}
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
                className="input input-bordered w-full input-lg"
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
                className="select select-bordered w-full select-lg"
                disabled
              >
                <option value="student">{t.register.roleStudent}</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t.register.department}</span>
                <span className="label-text-alt text-error">*</span>
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="select select-bordered w-full select-lg"
                required
              >
                <option value="">{t.register.departmentPlaceholder}</option>
                <option value="Engineering">{t.register.deptEngineering}</option>
                <option value="Science">{t.register.deptScience}</option>
                <option value="Business Administration">{t.register.deptBusiness}</option>
                <option value="Education">{t.register.deptEducation}</option>
                <option value="Law">{t.register.deptLaw}</option>
                <option value="Medicine">{t.register.deptMedicine}</option>
                <option value="Nursing">{t.register.deptNursing}</option>
                <option value="Information Technology">{t.register.deptIT}</option>
                <option value="Computer Science">{t.register.deptComputerScience}</option>
                <option value="Architecture">{t.register.deptArchitecture}</option>
                <option value="Liberal Arts">{t.register.deptArts}</option>
                <option value="Communication Arts">{t.register.deptCommunication}</option>
                <option value="Economics">{t.register.deptEconomics}</option>
                <option value="Accounting">{t.register.deptAccounting}</option>
                <option value="Other">{t.register.deptOther}</option>
              </select>
            </div>

            {formData.role === 'student' && (
              <>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t.register.grade}</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    className="select select-bordered w-full select-lg"
                    required
                  >
                    <option value="">{t.register.gradePlaceholder}</option>
                    <option value="1">{t.register.gradeYear1}</option>
                    <option value="2">{t.register.gradeYear2}</option>
                    <option value="3">{t.register.gradeYear3}</option>
                    <option value="4">{t.register.gradeYear4}</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t.register.class}</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <select
                    name="class"
                    value={formData.class}
                    onChange={handleInputChange}
                    className="select select-bordered w-full select-lg"
                    required
                  >
                    <option value="">{t.register.classPlaceholder}</option>
                    <option value="1">{t.register.class1}</option>
                    <option value="2">{t.register.class2}</option>
                    <option value="3">{t.register.class3}</option>
                    <option value="4">{t.register.class4}</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

      <div className="divider"></div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">
          {t.register.faceImage}
          <span className="text-error ml-2">*</span>
        </h2>

        <FaceUpload
          onFaceDetected={handleFaceDetected}
          onImageRemove={handleImageRemove}
          currentImage={faceImagePreview}
        />
      </div>

      <div className="flex gap-4 justify-end pt-6">
        <button
          type="button"
          onClick={handleCancel}
          className="btn btn-outline btn-lg px-8"
          disabled={isSubmitting}
        >
          {t.register.cancel}
        </button>
        <button
          type="submit"
          className="btn btn-primary btn-lg px-8"
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
