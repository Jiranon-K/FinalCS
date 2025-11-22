'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { Student } from '@/types/student';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCheck, faEnvelope, faKey, faTimes } from '@fortawesome/free-solid-svg-icons';

interface ActivateStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (studentId: string, email: string, password?: string) => Promise<void>;
  student: Student | null;
}

export default function ActivateStudentModal({
  isOpen,
  onClose,
  onConfirm,
  student,
}: ActivateStudentModalProps) {
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (student) {
      setEmail(student.email || '');
      setPassword(student.studentId || '');
      setError('');
    }
  }, [student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !student._id) return;
    if (!email) {
      setError(t.users.emailRequired);
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onConfirm(student._id, email, password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.users.activateError);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !student) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-primary">
          <FontAwesomeIcon icon={faUserCheck} />
          {t.users.activate}
        </h3>

        <div className="py-4 space-y-4">
          <div className="flex flex-col gap-1 p-3 bg-base-200 rounded-lg">
            <span className="text-xs font-semibold opacity-60 uppercase">{t.students.name}</span>
            <span className="font-medium text-lg">{student.name}</span>
          </div>

          <div className="flex flex-col gap-1 p-3 bg-base-200 rounded-lg">
            <span className="text-xs font-semibold opacity-60 uppercase">{t.students.studentId}</span>
            <span className="font-mono">{student.studentId}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text flex items-center gap-2">
                  <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 opacity-70" />
                  {t.users.email} <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="email"
                placeholder={t.users.emailPlaceholder}
                className="input input-bordered w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text flex items-center gap-2">
                  <FontAwesomeIcon icon={faKey} className="w-4 h-4 opacity-70" />
                  {t.users.password}
                </span>
                <span className="label-text-alt text-base-content/50">
                  {t.users.defaultPasswordDesc}
                </span>
              </label>
              <input
                type="text"
                placeholder={t.users.passwordPlaceholder}
                className="input input-bordered w-full font-mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <label className="label">
                <span className="label-text-alt text-warning">
                  {t.users.studentIdWillBePassword}
                </span>
              </label>
            </div>

            {error && (
              <div className="alert alert-error text-sm py-2">
                <span>{error}</span>
              </div>
            )}

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={loading}
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="btn btn-primary min-w-[120px]"
                disabled={loading}
              >
                {loading ? <span className="loading loading-spinner loading-xs"></span> : null}
                {t.users.activate}
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="modal-backdrop" onClick={loading ? undefined : onClose}></div>
    </div>
  );
}
