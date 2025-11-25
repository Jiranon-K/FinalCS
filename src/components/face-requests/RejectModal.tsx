'use client';

import { useState } from 'react';
import { useLocale } from '@/hooks/useLocale';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isSubmitting: boolean;
}

export default function RejectModal({ isOpen, onClose, onConfirm, isSubmitting }: RejectModalProps) {
  const { t } = useLocale();
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      onConfirm(reason);
    }
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{t.faceRequests.rejectMessage}</h3>
        <form onSubmit={handleSubmit} className="py-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">{t.faceRequests.rejectionReason}</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-24"
              placeholder={t.faceRequests.rejectionReasonPlaceholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              disabled={isSubmitting}
            ></textarea>
          </div>
          <div className="modal-action">
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t.register.cancel}
            </button>
            <button 
              type="submit" 
              className="btn btn-error"
              disabled={!reason.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                t.faceRequests.reject
              )}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
