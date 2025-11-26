'use client';

import { useState, useMemo, useRef } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import { AttendanceRecord } from '@/types/attendance';
import { UserProfile } from '@/contexts/AuthContext';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  user: UserProfile;
  onRefresh: () => void;
}

type SortKey = 'studentName' | 'studentNumber' | 'status' | 'checkInTime';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
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
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

export default function AttendanceTable({ records, user, onRefresh }: AttendanceTableProps) {
  const { t } = useLocale();
  const { showToast } = useToast();
  const [adjustingRecord, setAdjustingRecord] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'checkInTime', direction: 'desc' });
  const modalRef = useRef<HTMLDialogElement>(null);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const canAdjustAttendance = user.role === 'admin' || user.role === 'teacher';

  const sortedRecords = useMemo(() => {
    if (!records) return [];
    
    const sorted = [...records];
    sorted.sort((a, b) => {
      let aValue: any = a[sortConfig.key];
      let bValue: any = b[sortConfig.key];

      if (aValue === undefined || aValue === null) aValue = '';
      if (bValue === undefined || bValue === null) bValue = '';

      if (sortConfig.key === 'checkInTime') {
        aValue = a.checkInTime ? new Date(a.checkInTime).getTime() : 0;
        bValue = b.checkInTime ? new Date(b.checkInTime).getTime() : 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  }, [records, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <div className="w-4 h-4 opacity-0 group-hover:opacity-30 transition-opacity">↕</div>;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'normal':
        return 'badge-success bg-success/10 text-success border-success/20';
      case 'late':
        return 'badge-warning bg-warning/10 text-warning border-warning/20';
      case 'absent':
        return 'badge-error bg-error/10 text-error border-error/20';
      case 'leave':
        return 'badge-info bg-info/10 text-info border-info/20';
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

  const openAdjustModal = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    if (modalRef.current) {
      modalRef.current.showModal();
    }
  };

  const handleAdjustStatus = async (newStatus: string, note?: string) => {
    if (!selectedRecord) return;
    const recordId = selectedRecord._id?.toString() || selectedRecord.id;

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
        if (modalRef.current) {
          modalRef.current.close();
        }
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
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-base-100 rounded-2xl border border-base-200 border-dashed">
        <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mb-4 text-base-content/30">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-base-content/70">{t.attendanceManagement.noRecords}</h3>
        <p className="text-sm text-base-content/50 mt-1">{t.attendanceManagement.noRecordsDetail}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200/50 text-base-content/70 text-xs uppercase font-bold tracking-wider border-b border-base-200">
                <th className="py-4 pl-6 w-16">#</th>
                <th 
                  className="py-4 cursor-pointer hover:bg-base-200 transition-colors group"
                  onClick={() => requestSort('studentName')}
                >
                  <div className="flex items-center gap-2">
                    {t.attendanceManagement.studentName}
                    <span className="font-sans text-base">{getSortIcon('studentName')}</span>
                  </div>
                </th>
                <th 
                  className="py-4 cursor-pointer hover:bg-base-200 transition-colors group"
                  onClick={() => requestSort('studentNumber')}
                >
                  <div className="flex items-center gap-2">
                    {t.attendanceManagement.studentNumber}
                    <span className="font-sans text-base">{getSortIcon('studentNumber')}</span>
                  </div>
                </th>
                <th 
                  className="py-4 cursor-pointer hover:bg-base-200 transition-colors group"
                  onClick={() => requestSort('status')}
                >
                  <div className="flex items-center gap-2">
                    {t.attendanceManagement.status}
                    <span className="font-sans text-base">{getSortIcon('status')}</span>
                  </div>
                </th>
                <th 
                  className="py-4 cursor-pointer hover:bg-base-200 transition-colors group"
                  onClick={() => requestSort('checkInTime')}
                >
                  <div className="flex items-center gap-2">
                    {t.attendanceManagement.checkInTime}
                    <span className="font-sans text-base">{getSortIcon('checkInTime')}</span>
                  </div>
                </th>
                <th className="py-4">{t.attendanceManagement.method}</th>
                {canAdjustAttendance && (
                  <th className="py-4 text-right pr-6">{t.attendanceManagement.actions}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedRecords.map((record, idx) => (
                <tr key={record._id?.toString() || record.id} className="hover:bg-base-100 transition-colors group border-b border-base-100 last:border-0">
                  <td className="pl-6 py-4 text-base-content/50 font-mono text-xs">{idx + 1}</td>
                  <td>
                    <div className="flex flex-col">
                      <span className="font-bold text-base group-hover:text-primary transition-colors">{record.studentName}</span>
                      {record.adjustedAt && (
                        <div className="text-xs text-warning flex items-center gap-1 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M13.836 2.477a.75.75 0 0 1 .75.75v3.182a.75.75 0 0 1-.75.75h-3.182a.75.75 0 0 1 0-1.5h1.37l-.84-.841a4.5 4.5 0 0 0-7.08.932.75.75 0 0 1-1.3-.75 6 6 0 0 1 9.44-1.242l.842.84V3.227a.75.75 0 0 1 .75-.75Zm-.911 7.5A.75.75 0 0 1 13.199 11a6 6 0 0 1-9.44 1.241l-.84-.84v1.371a.75.75 0 0 1-1.5 0V9.591a.75.75 0 0 1 .75-.75H5.35a.75.75 0 0 1 0 1.5H3.98l.841.841a4.5 4.5 0 0 0 7.08-.932.75.75 0 0 1 1.025-.273Z" clipRule="evenodd" />
                          </svg>
                          {t.attendanceManagement.adjusted} {formatDate(record.adjustedAt)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-sm bg-base-200/50 px-2 py-1 rounded">{record.studentNumber || '-'}</span>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1 items-start">
                      <div className={`badge gap-1.5 font-medium ${getStatusBadgeClass(record.status)}`}>
                        {getStatusIcon(record.status)}
                        {getStatusText(record.status)}
                      </div>
                      {record.originalStatus && record.originalStatus !== record.status && (
                        <span className="text-[10px] text-base-content/40 px-1">
                          {t.attendanceManagement.originalStatus}: {getStatusText(record.originalStatus)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="font-mono text-sm">{formatTime(record.checkInTime)}</span>
                      {record.checkOutTime && (
                        <span className="text-xs text-base-content/50">
                          Out: {formatTime(record.checkOutTime)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <span className="badge badge-sm badge-outline gap-1 text-xs">
                        {record.checkInMethod === 'face_recognition' ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                              <path fillRule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM5.707 6.707a1 1 0 0 0-1.414-1.414l-1 1a1 1 0 0 0 0 1.414l1 1a1 1 0 0 0 1.414-1.414L5.414 7l.293-.293Zm5.586-1.414a1 1 0 0 0-1.414 1.414L10.586 7l-.293.293a1 1 0 0 0 1.414 1.414l1-1a1 1 0 0 0 0-1.414l-1-1Z" clipRule="evenodd" />
                            </svg>
                            {t.attendanceManagement.faceRecognition}
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                              <path fillRule="evenodd" d="M11.986 3H12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h.014c.117-1.12.5-2 1.986-2h4c1.486 0 1.87 .88 1.986 2ZM5 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm6 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                            </svg>
                            {t.attendanceManagement.manual}
                          </>
                        )}
                      </span>
                      {record.confidence && (
                        <span className="text-[10px] text-base-content/40 px-1">
                          {t.attendanceManagement.matchPercentage.replace('{confidence}', (record.confidence * 100).toFixed(0))}
                        </span>
                      )}
                    </div>
                  </td>
                  {canAdjustAttendance && (
                    <td className="text-right pr-6">
                      <button
                        onClick={() => openAdjustModal(record)}
                        className="btn btn-ghost btn-sm btn-square text-base-content/70 hover:text-primary hover:bg-primary/10 transition-colors"
                        title={t.attendanceManagement.actions}
                      >
                        <EditIcon />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <dialog ref={modalRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">{t.attendanceManagement.actions}</h3>
          
          {selectedRecord && (
            <div className="space-y-4">
              <div className="p-4 bg-base-200 rounded-lg">
                <div className="font-bold">{selectedRecord.studentName}</div>
                <div className="text-sm opacity-70">{selectedRecord.studentNumber}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAdjustStatus('normal')}
                  disabled={adjustingRecord === (selectedRecord._id?.toString() || selectedRecord.id)}
                  className={`btn btn-outline ${selectedRecord.status === 'normal' ? 'btn-active' : ''} hover:btn-success hover:text-white`}
                >
                  <CheckCircleIcon />
                  {t.attendanceManagement.statusNormal}
                </button>
                <button
                  onClick={() => handleAdjustStatus('late')}
                  disabled={adjustingRecord === (selectedRecord._id?.toString() || selectedRecord.id)}
                  className={`btn btn-outline ${selectedRecord.status === 'late' ? 'btn-active' : ''} hover:btn-warning hover:text-white`}
                >
                  <ClockIcon />
                  {t.attendanceManagement.statusLate}
                </button>
                <button
                  onClick={() => handleAdjustStatus('absent')}
                  disabled={adjustingRecord === (selectedRecord._id?.toString() || selectedRecord.id)}
                  className={`btn btn-outline ${selectedRecord.status === 'absent' ? 'btn-active' : ''} hover:btn-error hover:text-white`}
                >
                  <XCircleIcon />
                  {t.attendanceManagement.statusAbsent}
                </button>
                <button
                  onClick={() => handleAdjustStatus('leave', t.attendanceManagement.markedAsLeave)}
                  disabled={adjustingRecord === (selectedRecord._id?.toString() || selectedRecord.id)}
                  className={`btn btn-outline ${selectedRecord.status === 'leave' ? 'btn-active' : ''} hover:btn-info hover:text-white`}
                >
                  <DocumentIcon />
                  {t.attendanceManagement.statusLeave}
                </button>
              </div>
            </div>
          )}

          <div className="modal-action">
            <form method="dialog">
              <button className="btn">{t.common.close}</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}
