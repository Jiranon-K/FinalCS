"use client";

import { useState } from "react";
import { AttendanceSession } from "@/types/session";
import { useLocale } from "@/hooks/useLocale";
import { useToast } from "@/hooks/useToast";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import {
  ArchiveIcon,
  RefreshIcon,
  DeleteIcon,
  ClockIcon,
} from "@/components/common/Icons";

interface SessionTableProps {
  sessions: AttendanceSession[];
  loading: boolean;
  onSessionClosed: () => void;
  onSessionDeleted: () => void;
  readOnly?: boolean;
}

export default function SessionTable({
  sessions,
  loading,
  onSessionClosed,
  onSessionDeleted,
  readOnly = false,
}: SessionTableProps) {
  const { t } = useLocale();
  const { showToast } = useToast();

  const [closingSession, setClosingSession] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] =
    useState<AttendanceSession | null>(null);
  const [deleting, setDeleting] = useState(false);

  const formatSessionDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
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
      const response = await fetch(
        `/api/attendance/sessions/${sessionId}/close`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const result = await response.json();

      if (result.success) {
        showToast({
          message: t.attendanceManagement.closeSessionSuccess,
          type: "success",
        });
        onSessionClosed();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error closing session:", error);
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t.attendanceManagement.closeSessionError,
        type: "error",
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
      const response = await fetch(
        `/api/attendance/sessions/${sessionToDelete.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const result = await response.json();

      if (result.success) {
        showToast({
          message:
            t.attendanceManagement.deleteSessionSuccess ||
            "ลบประวัติ Session สำเร็จ",
          type: "success",
        });
        onSessionDeleted();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t.attendanceManagement.deleteSessionError ||
              "เกิดข้อผิดพลาดในการลบประวัติ Session",
        type: "error",
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
          <ClockIcon className="w-6 h-6 text-base-content/40" />
        </div>
        <p className="text-base-content/60">
          {t.attendanceManagement.noRecords}
        </p>
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
              <th>
                {t.attendanceManagement.present}/
                {t.attendanceManagement.expected}
              </th>
              <th>{t.attendanceManagement.actions}</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td className="font-medium">{session.courseCode}</td>
                <td>{session.courseName}</td>
                <td>{formatSessionDate(session.sessionDate)}</td>
                <td>
                  {session.startTime} - {session.endTime}
                </td>
                <td>{session.room}</td>
                <td>
                  {session.status === "active" ? (
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
                  ) : session.status === "closed" ? (
                    <span className="badge badge-neutral">
                      {t.attendanceManagement.statusClosed}
                    </span>
                  ) : (
                    <span className="badge badge-warning">
                      {t.attendanceManagement.statusCancelled}
                    </span>
                  )}
                </td>
                <td>
                  <span className="font-medium text-success">
                    {session.stats.presentCount}
                  </span>
                  <span className="text-base-content/40"> / </span>
                  <span>{session.stats.expectedCount}</span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    {!readOnly && session.status === "active" ? (
                      <button
                        className="btn btn-error btn-xs gap-1"
                        onClick={() => handleCloseSession(session.id)}
                        disabled={closingSession === session.id}
                      >
                        {closingSession === session.id ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <ArchiveIcon className="w-3 h-3" />
                        )}
                        {t.attendanceManagement.statusClosed}
                      </button>
                    ) : (
                      <span className="text-base-content/40">
                        {readOnly ? "-" : "-"}
                      </span>
                    )}

                    {/* Re-open Button for Closed Sessions */}
                    {!readOnly && session.status === "closed" && (
                      <button
                        className="btn btn-warning btn-xs gap-1"
                        onClick={async () => {
                          try {
                            setClosingSession(session.id); 

                            const requestData = {
                              courseId: session.courseId,
                              sessionDate: session.sessionDate,
                              dayOfWeek: session.dayOfWeek,
                              startTime: session.startTime,
                              endTime: session.endTime,
                              room: session.room,
                            };

                            const response = await fetch(
                              "/api/attendance/sessions/open",
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(requestData),
                                credentials: "include",
                              },
                            );

                            const result = await response.json();

                            if (result.success) {
                              showToast({
                                message:
                                  t.attendanceManagement.openSessionSuccess ||
                                  "Session re-opened successfully",
                                type: "success",
                              });
                              onSessionClosed();
                            } else {
                              throw new Error(result.error);
                            }
                          } catch (error) {
                            console.error("Error re-opening session:", error);
                            showToast({
                              message:
                                error instanceof Error
                                  ? error.message
                                  : t.attendanceManagement.openSessionError,
                              type: "error",
                            });
                          } finally {
                            setClosingSession(null);
                          }
                        }}
                        disabled={closingSession === session.id}
                        title={
                          t.attendanceManagement.reopen || "เปิดใช้งานอีกครั้ง"
                        }
                      >
                        {closingSession === session.id ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <RefreshIcon className="w-3 h-3" />
                        )}
                        {t.attendanceManagement.reopen || "Re-open"}
                      </button>
                    )}

                    {!readOnly && session.status === "closed" && (
                      <button
                        className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                        onClick={() => handleDeleteClick(session)}
                        title={t.users.delete || "ลบ"}
                      >
                        <DeleteIcon className="w-3 h-3" />
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
        title={t.attendanceManagement.deleteSession || "ลบประวัติ Session"}
        message={`${t.attendanceManagement.confirmDeleteSession || "คุณต้องการลบประวัติ Session"} "${sessionToDelete?.courseCode} - ${sessionToDelete?.courseName}" ${t.attendanceManagement.onDate || "วันที่"} ${sessionToDelete ? formatSessionDate(sessionToDelete.sessionDate) : ""}?`}
        confirmLabel={t.users.delete || "ลบ"}
        cancelLabel={t.users.cancel || "ยกเลิก"}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={deleting}
      />
    </>
  );
}
