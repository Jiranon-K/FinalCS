'use client';

import { useState } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faEye } from '@fortawesome/free-solid-svg-icons';
import RejectModal from './RejectModal';

interface FaceRequest {
  _id: string;
  userId: {
    username: string;
    fullName?: string;
    studentId?: string;
  };
  studentId: {
    name: string;
    studentId: string;
    email?: string;
    department?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  newImageUrl: string;
  oldImageUrl?: string;
  rejectionReason?: string;
}

interface FaceRequestsTableProps {
  requests: FaceRequest[];
  onRefresh: () => void;
}

export default function FaceRequestsTable({ requests, onRefresh }: FaceRequestsTableProps) {
  const { t } = useLocale();
  const { showToast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<FaceRequest | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async (request: FaceRequest) => {
    if (!confirm(t.faceRequests.approveMessage)) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/face-update-requests/${request._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast({ message: t.faceRequests.approveSuccess, type: 'success' });
        onRefresh();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      showToast({ message: t.faceRequests.approveError, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/face-update-requests/${selectedRequest._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejectionReason: reason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast({ message: t.faceRequests.rejectSuccess, type: 'success' });
        setIsRejectModalOpen(false);
        setSelectedRequest(null);
        onRefresh();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      showToast({ message: t.faceRequests.rejectError, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectModal = (request: FaceRequest) => {
    setSelectedRequest(request);
    setIsRejectModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <div className="badge badge-success gap-2">{t.faceRequests.approved}</div>;
      case 'rejected': return <div className="badge badge-error gap-2">{t.faceRequests.rejected}</div>;
      default: return <div className="badge badge-warning gap-2">{t.faceRequests.pending}</div>;
    }
  };

  return (
    <>
      <div className="overflow-x-auto bg-base-100 rounded-lg shadow border border-base-200">
        <table className="table">
          <thead>
            <tr>
              <th>{t.faceRequests.studentName}</th>
              <th>{t.faceRequests.studentId}</th>
              <th>{t.faceRequests.images}</th>
              <th>{t.faceRequests.requestDate}</th>
              <th>{t.faceRequests.status}</th>
              <th>{t.faceRequests.actions}</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-base-content/50">
                  {t.faceRequests.noRequests}
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req._id}>
                  <td>
                    <div className="font-bold">{req.studentId?.name || req.userId?.fullName || 'Unknown'}</div>
                    <div className="text-xs opacity-50">{req.studentId?.department}</div>
                  </td>
                  <td>{req.studentId?.studentId || req.userId?.studentId}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar placeholder">
                        <div className="w-12 h-12 rounded-lg bg-base-200 relative">
                          {req.oldImageUrl ? (
                            <Image src={req.oldImageUrl} alt="Old" fill className="object-cover" />
                          ) : (
                            <span className="text-xs">No Image</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xl">→</span>
                      <div className="avatar">
                        <div className="w-12 h-12 rounded-lg ring ring-primary ring-offset-base-100 ring-offset-2 relative">
                          <Image src={req.newImageUrl} alt="New" fill className="object-cover" />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">{new Date(req.requestedAt).toLocaleDateString()}</div>
                    <div className="text-xs opacity-50">{new Date(req.requestedAt).toLocaleTimeString()}</div>
                  </td>
                  <td>{getStatusBadge(req.status)}</td>
                  <td>
                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button 
                          className="btn btn-success btn-xs"
                          onClick={() => handleApprove(req)}
                          disabled={isProcessing}
                          title={t.faceRequests.approve}
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </button>
                        <button 
                          className="btn btn-error btn-xs"
                          onClick={() => openRejectModal(req)}
                          disabled={isProcessing}
                          title={t.faceRequests.reject}
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    )}
                    {req.status === 'rejected' && req.rejectionReason && (
                      <div className="tooltip" data-tip={req.rejectionReason}>
                         <button className="btn btn-ghost btn-xs">
                           <FontAwesomeIcon icon={faEye} />
                         </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <RejectModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleReject}
        isSubmitting={isProcessing}
      />
    </>
  );
}
