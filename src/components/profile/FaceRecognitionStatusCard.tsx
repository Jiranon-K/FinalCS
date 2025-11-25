'use client';

import { useLocale } from '@/hooks/useLocale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceSmile, faCheckCircle, faExclamationCircle, faCamera, faHistory } from '@fortawesome/free-solid-svg-icons';

interface FaceRecognitionStatusCardProps {
  hasFaceRegistered: boolean;
  faceDescriptorCount?: number;
  onRequestUpdate?: () => void;
  hasPendingRequest?: boolean;
  onViewHistory?: () => void;
}

export default function FaceRecognitionStatusCard({
  hasFaceRegistered,
  faceDescriptorCount = 0,
  onRequestUpdate,
  hasPendingRequest,
  onViewHistory,
}: FaceRecognitionStatusCardProps) {
  const { t } = useLocale();

  return (
    <div className="card bg-base-100 shadow-xl border border-base-200">
      <div className="card-body p-6">
        <h3 className="font-bold text-lg mb-4 border-b pb-2">{t.profile.faceRecognitionStatus}</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              hasFaceRegistered ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
            }`}>
              <FontAwesomeIcon icon={hasFaceRegistered ? faCheckCircle : faExclamationCircle} className="text-lg" />
            </div>
            <div>
              <div className="text-sm font-medium">
                {hasFaceRegistered ? t.profile.faceRegistered : t.profile.faceNotRegistered}
              </div>
              <div className="text-xs text-base-content/60">
                {hasFaceRegistered 
                  ? t.profile.faceRegisteredDesc 
                  : t.profile.faceNotRegisteredDesc
                }
              </div>
            </div>
          </div>

          {hasFaceRegistered && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-info/20 flex items-center justify-center text-info">
                <FontAwesomeIcon icon={faFaceSmile} className="text-lg" />
              </div>
              <div>
                <div className="text-sm font-medium">{t.profile.faceDescriptors}</div>
                <div className="text-xs text-base-content/60">
                  {faceDescriptorCount} {t.profile.descriptorsRegistered}
                </div>
              </div>
            </div>
          )}

          {hasPendingRequest && (
            <div className="alert alert-info py-2">
              <span className="text-sm">{t.profile.pendingApproval}</span>
            </div>
          )}

          {onRequestUpdate && (
            <button
              onClick={onRequestUpdate}
              className="btn btn-outline btn-primary btn-sm w-full mt-2"
            >
              <FontAwesomeIcon icon={faCamera} className="mr-2" />
              {t.profile.requestFaceUpdate}
            </button>
          )}

          {onViewHistory && (
            <button
              onClick={onViewHistory}
              className="btn btn-ghost btn-sm w-full mt-1 text-base-content/70"
            >
              <FontAwesomeIcon icon={faHistory} className="mr-2" />
              {t.profile.viewHistory || 'View History'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
