'use client';

import { useState } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import { AttendanceRecord } from '@/types/attendance';
import { UserProfile } from '@/contexts/AuthContext';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  user: UserProfile;
  onRefresh: () => void;
}

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const XCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const DocumentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

export default function AttendanceTable({ records, user, onRefresh }: AttendanceTableProps) {
  const { t } = useLocale();
  const { showToast } = useToast();
  const [adjustingRecord, setAdjustingRecord] = useState<string | null>(null);

  const canAdjustAttendance = user.role === 'admin' || user.role === 'teacher';

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'normal':
        return 'badge-success';
      case 'late':
        return 'badge-warning';
      case 'absent':
        return 'badge-error';
      case 'leave':
        return 'badge-info';
      default:
        return 'badge-ghost';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircleIcon />;
      case 'late':
        return <ClockIcon />;
      case 'absent':
        return <XCircleIcon />;
      case 'leave':
        return <DocumentIcon />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'normal':
        return t.attendanceManagement.statusNormal;
      case 'late':
        return t.attendanceManagement.statusLate;
      case 'absent':
        return t.attendanceManagement.statusAbsent;
      case 'leave':
        return t.attendanceManagement.statusLeave;
      default:
        return status;
    }
  };

  const handleAdjustStatus = async (recordId: string, newStatus: string, note?: string) => {
    try {
      setAdjustingRecord(recordId);

      const response = await fetch(`/api/attendance/records/${recordId}/adjust`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note }),
      });

      const result = await response.json();

      if (result.success) {
        showToast({ message: t.attendanceManagement.adjustSuccess, type: 'success' });
        onRefresh();
      } else {
        throw new Error(result.error || t.attendanceManagement.adjustError);
      }
    } catch (error) {
      console.error('Error adjusting attendance:', error);
      showToast({
        message: error instanceof Error ? error.message : t.attendanceManagement.adjustError,
        type: 'error',
      });
    } finally {
      setAdjustingRecord(null);
    }
  };

  const formatTime = (date?: Date | string) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (records.length === 0) {
    return (
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <p className="text-center text-base-content/50 py-8">
            {t.attendanceManagement.noRecords}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body p-0">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr className="bg-base-200">
                <th className="text-base-content font-bold">#</th>
                <th className="text-base-content font-bold">
                  {t.attendanceManagement.studentName}
                </th>
                <th className="text-base-content font-bold">
                  {t.attendanceManagement.studentNumber}
                </th>
                <th className="text-base-content font-bold">
                  {t.attendanceManagement.status}
                </th>
                <th className="text-base-content font-bold">
                  {t.attendanceManagement.checkInTime}
                </th>
                <th className="text-base-content font-bold">
                  {t.attendanceManagement.method}
                </th>
                {canAdjustAttendance && (
                  <th className="text-base-content font-bold text-right">
                    {t.attendanceManagement.actions}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {records.map((record, idx) => (
                <tr key={record._id?.toString() || record.id} className="hover:bg-base-200/50">
                  <td>{idx + 1}</td>
                  <td>
                    <div className="font-semibold">{record.studentName}</div>
                    {record.adjustedAt && (
                      <div className="text-xs text-base-content/50">
                        {t.attendanceManagement.adjusted}: {formatDate(record.adjustedAt)}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="font-mono text-sm">{record.studentNumber || '-'}</span>
                  </td>
                  <td>
                    <div className={`badge gap-1 ${getStatusBadgeClass(record.status)}`}>
                      {getStatusIcon(record.status)}
                      {getStatusText(record.status)}
                    </div>
                    {record.originalStatus && record.originalStatus !== record.status && (
                      <div className="text-xs text-base-content/50 mt-1">
                        {t.attendanceManagement.originalStatus}: {getStatusText(record.originalStatus)}
                      </div>
                    )}
                  </td>
                  <td>
                    <div>{formatTime(record.checkInTime)}</div>
                    {record.checkOutTime && (
                      <div className="text-xs text-base-content/50">
                        {t.attendanceManagement.checkOut}: {formatTime(record.checkOutTime)}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-sm badge-outline">
                      {record.checkInMethod === 'face_recognition'
                        ? t.attendanceManagement.faceRecognition
                        : t.attendanceManagement.manual}
                    </span>
                    {record.confidence && (
                      <div className="text-xs text-base-content/50">
                        {(record.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                  </td>
                  {canAdjustAttendance && (
                    <td>
                      <div className="flex justify-end gap-1">
                        <div className="dropdown dropdown-end">
                          <button
                            tabIndex={0}
                            className="btn btn-ghost btn-sm btn-square"
                            disabled={adjustingRecord === (record._id?.toString() || record.id)}
                          >
                            {adjustingRecord === (record._id?.toString() || record.id) ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <EditIcon />
                            )}
                          </button>
                          <ul
                            tabIndex={0}
                            className="dropdown-content z-1 menu p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-300"
                          >
                            <li>
                              <button
                                onClick={() =>
                                  handleAdjustStatus(record._id?.toString() || record.id, 'normal')
                                }
                                className="text-success"
                              >
                                <CheckCircleIcon />
                                {t.attendanceManagement.statusNormal}
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() =>
                                  handleAdjustStatus(record._id?.toString() || record.id, 'late')
                                }
                                className="text-warning"
                              >
                                <ClockIcon />
                                {t.attendanceManagement.statusLate}
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() =>
                                  handleAdjustStatus(record._id?.toString() || record.id, 'absent')
                                }
                                className="text-error"
                              >
                                <XCircleIcon />
                                {t.attendanceManagement.statusAbsent}
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() =>
                                  handleAdjustStatus(
                                    record._id?.toString() || record.id,
                                    'leave',
                                    t.attendanceManagement.markedAsLeave
                                  )
                                }
                                className="text-info"
                              >
                                <DocumentIcon />
                                {t.attendanceManagement.statusLeave}
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
