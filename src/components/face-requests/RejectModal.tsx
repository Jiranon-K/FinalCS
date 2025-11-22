'use client';

import { useState } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';

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
      setReason('');
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-error text-xl" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{t.faceRequests.confirmReject}</h3>
            <p className="text-sm text-base-content/60">{t.faceRequests.rejectMessage}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t.faceRequests.rejectionReason} <span className="text-error">*</span></span>
            </label>
            <textarea
              className="textarea textarea-bordered textarea-error focus:textarea-error h-28 resize-none"
              placeholder={t.faceRequests.rejectionReasonPlaceholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              disabled={isSubmitting}
              autoFocus
            ></textarea>
            {!reason.trim() && (
              <label className="label">
                <span className="label-text-alt text-error">{t.faceRequests.rejectionReasonRequired}</span>
              </label>
            )}
          </div>

          {/* Actions */}
          <div className="modal-action mt-6">
            <button 
              type="button" 
              className="btn btn-ghost gap-2" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              <FontAwesomeIcon icon={faTimes} />
              {t.faceRequests.cancel}
            </button>
            <button 
              type="submit" 
              className="btn btn-error gap-2"
              disabled={!reason.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  {t.faceRequests.reject}
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  {t.faceRequests.reject}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop bg-black/50">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  );
}
