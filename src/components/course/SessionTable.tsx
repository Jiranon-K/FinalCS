'use client';

import { useState } from 'react';
import { AttendanceSession } from '@/types/session';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

interface SessionTableProps {
  sessions: AttendanceSession[];
  loading: boolean;
  onSessionClosed: () => void;
  onSessionDeleted: () => void;
}

export default function SessionTable({
  sessions,
  loading,
  onSessionClosed,
  onSessionDeleted,
}: SessionTableProps) {
  const { t } = useLocale();
  const { showToast } = useToast();

  const [closingSession, setClosingSession] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<AttendanceSession | null>(null);
  const [deleting, setDeleting] = useState(false);

  const formatSessionDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getSessionDuration = (openedAt: Date | string) => {
    const start = new Date(openedAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleCloseSession = async (sessionId: string) => {
    try {
      setClosingSession(sessionId);
      const response = await fetch(`/api/attendance/sessions/${sessionId}/close`, {
        method: 'POST',
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        showToast({ message: t.attendanceManagement.closeSessionSuccess, type: 'success' });
        onSessionClosed();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error closing session:', error);
      showToast({
        message: error instanceof Error ? error.message : t.attendanceManagement.closeSessionError,
        type: 'error',
      });
    } finally {
      setClosingSession(null);
    }
  };

  const handleDeleteClick = (session: AttendanceSession) => {
    setSessionToDelete(session);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/attendance/sessions/${sessionToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        showToast({
          message: t.attendanceManagement.deleteSessionSuccess || 'ลบประวัติ Session สำเร็จ',
          type: 'success'
        });
        onSessionDeleted();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      showToast({
        message: error instanceof Error ? error.message : t.attendanceManagement.deleteSessionError || 'เกิดข้อผิดพลาดในการลบประวัติ Session',
        type: 'error',
      });
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setSessionToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setSessionToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-base-200 rounded-xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center mx-auto mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-base-content/40">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <p className="text-base-content/60">{t.attendanceManagement.noRecords}</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>{t.course.courseCode}</th>
              <th>{t.course.courseName}</th>
              <th>{t.attendanceManagement.sessionDate}</th>
              <th>{t.course.scheduleSlots}</th>
              <th>{t.course.room}</th>
              <th>{t.attendanceManagement.status}</th>
              <th>{t.attendanceManagement.present}/{t.attendanceManagement.expected}</th>
              <th>{t.attendanceManagement.actions}</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td className="font-medium">{session.courseCode}</td>
                <td>{session.courseName}</td>
                <td>{formatSessionDate(session.sessionDate)}</td>
                <td>{session.startTime} - {session.endTime}</td>
                <td>{session.room}</td>
                <td>
                  {session.status === 'active' ? (
                    <div className="flex items-center gap-2">
                      <span className="badge badge-success gap-1">
                        <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                        {t.attendanceManagement.statusActive}
                      </span>
                      {session.openedAt && (
                        <span className="text-xs text-base-content/50">
                          {getSessionDuration(session.openedAt)}
                        </span>
                      )}
                    </div>
                  ) : session.status === 'closed' ? (
                    <span className="badge badge-neutral">{t.attendanceManagement.statusClosed}</span>
                  ) : (
                    <span className="badge badge-warning">{t.attendanceManagement.statusCancelled}</span>
                  )}
                </td>
                <td>
                  <span className="font-medium text-success">{session.stats.presentCount}</span>
                  <span className="text-base-content/40"> / </span>
                  <span>{session.stats.expectedCount}</span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    {session.status === 'active' ? (
                      <button
                        className="btn btn-error btn-xs gap-1"
                        onClick={() => handleCloseSession(session.id)}
                        disabled={closingSession === session.id}
                      >
                        {closingSession === session.id ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
                          </svg>
                        )}
                        {t.attendanceManagement.statusClosed}
                      </button>
                    ) : (
                      <span className="text-base-content/40">-</span>
                    )}

                    {session.status === 'closed' && (
                      <button
                        className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                        onClick={() => handleDeleteClick(session)}
                        title={t.users.delete || 'ลบ'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title={t.attendanceManagement.deleteSession || 'ลบประวัติ Session'}
        message={`${t.attendanceManagement.confirmDeleteSession || 'คุณต้องการลบประวัติ Session'} "${sessionToDelete?.courseCode} - ${sessionToDelete?.courseName}" ${t.attendanceManagement.onDate || 'วันที่'} ${sessionToDelete ? formatSessionDate(sessionToDelete.sessionDate) : ''}?`}
        confirmLabel={t.users.delete || 'ลบ'}
        cancelLabel={t.users.cancel || 'ยกเลิก'}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={deleting}
      />
    </>
  );
}
