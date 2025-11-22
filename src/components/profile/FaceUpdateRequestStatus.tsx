'use client';

import { useLocale } from '@/hooks/useLocale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCheckCircle, faTimesCircle, faCalendarAlt, faComment } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

interface FaceUpdateRequest {
  _id: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  newImageUrl: string;
}

interface FaceUpdateRequestStatusProps {
  request: FaceUpdateRequest;
  onCancel: () => void;
}

export default function FaceUpdateRequestStatus({ request, onCancel }: FaceUpdateRequestStatusProps) {
  const { t } = useLocale();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'alert-success';
      case 'rejected': return 'alert-error';
      default: return 'alert-warning';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return faCheckCircle;
      case 'rejected': return faTimesCircle;
      default: return faClock;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return t.faceRequests.approved;
      case 'rejected': return t.faceRequests.rejected;
      default: return t.faceRequests.pending;
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl border border-base-200">
      <div className="card-body">
        <h3 className="card-title text-lg flex items-center gap-2">
          {t.profile.faceUpdateRequest}
        </h3>

        <div className={`alert ${getStatusColor(request.status)} shadow-sm`}>
          <FontAwesomeIcon icon={getStatusIcon(request.status)} className="text-xl" />
          <div>
            <h3 className="font-bold">{getStatusText(request.status)}</h3>
            <div className="text-xs">
              {request.status === 'pending' && t.profile.pendingApproval}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <FontAwesomeIcon icon={faCalendarAlt} className="mt-1 text-base-content/50" />
              <div>
                <div className="text-sm font-semibold">{t.faceRequests.requestDate}</div>
                <div className="text-sm opacity-70">
                  {new Date(request.requestedAt).toLocaleString()}
                </div>
              </div>
            </div>

            {request.status === 'rejected' && request.rejectionReason && (
              <div className="flex items-start gap-3 text-error">
                <FontAwesomeIcon icon={faComment} className="mt-1" />
                <div>
                  <div className="text-sm font-semibold">{t.profile.rejectedReason}</div>
                  <div className="text-sm">{request.rejectionReason}</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center">
            <div className="text-sm font-semibold mb-2">{t.profile.newFaceImage}</div>
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-base-300">
              <Image
                src={request.newImageUrl}
                alt="New Face Request"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {request.status === 'pending' && (
          <div className="card-actions justify-end mt-4">
            <button 
              className="btn btn-ghost text-error btn-sm"
              onClick={onCancel}
            >
              {t.profile.cancelRequest}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
