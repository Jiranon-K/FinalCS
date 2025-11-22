'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faCheckCircle, faTimesCircle, faClock, faTimes } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

interface FaceUpdateRequest {
  _id: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  newImageUrl: string;
}

interface FaceRequestHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FaceRequestHistory({ isOpen, onClose }: FaceRequestHistoryProps) {
  const { t } = useLocale();
  const [requests, setRequests] = useState<FaceUpdateRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/face-update-requests');
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return faCheckCircle;
      case 'rejected': return faTimesCircle;
      default: return faClock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-success';
      case 'rejected': return 'text-error';
      default: return 'text-warning';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="card bg-base-100 w-full max-w-2xl shadow-xl max-h-[80vh] flex flex-col">
        <div className="card-header p-4 border-b flex justify-between items-center sticky top-0 bg-base-100 z-10 rounded-t-xl">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <FontAwesomeIcon icon={faHistory} />
            {t.faceRequests.title || 'Request History'}
          </h3>
          <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <div className="card-body p-0 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center p-8 text-base-content/60">
              {t.faceRequests.noHistory || 'No request history found'}
            </div>
          ) : (
            <div className="divide-y">
              {requests.map((request) => (
                <div key={request._id} className="p-4 hover:bg-base-200/50 transition-colors">
                  <div className="flex gap-4">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-base-300 shrink-0">
                      <Image
                        src={request.newImageUrl}
                        alt="Request"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <div className={`flex items-center gap-2 font-bold ${getStatusColor(request.status)}`}>
                          <FontAwesomeIcon icon={getStatusIcon(request.status)} />
                          {getStatusText(request.status)}
                        </div>
                        <div className="text-xs text-base-content/50">
                          {new Date(request.requestedAt).toLocaleString()}
                        </div>
                      </div>
                      
                      {request.status === 'rejected' && request.rejectionReason && (
                        <div className="text-sm text-error mt-1 bg-error/10 p-2 rounded">
                          <span className="font-semibold">{t.profile.rejectedReason}:</span> {request.rejectionReason}
                        </div>
                      )}
                      
                      {request.status === 'approved' && request.reviewedAt && (
                        <div className="text-xs text-success mt-1">
                          {t.faceRequests.reviewedAt}: {new Date(request.reviewedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="card-footer p-4 border-t bg-base-100 rounded-b-xl">
          <button onClick={onClose} className="btn btn-ghost w-full">
            {t.common?.close || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
