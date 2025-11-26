'use client';

import { useState, useMemo } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import type { Course } from '@/types/course';
import type { AttendanceSession } from '@/types/session';
import type { AttendanceRecord } from '@/types/attendance';

interface StudentListManagerProps {
  course: Course;
  session: AttendanceSession;
  records: AttendanceRecord[];
  onRecordUpdated: () => void;
}

interface EnrolledStudentInfo {
  studentId: string;
  studentName: string;
  studentNumber?: string;
  record?: AttendanceRecord;
  hasFaceData: boolean;
}

export default function StudentListManager({
  course: _course,
  session,
  records,
  onRecordUpdated,
}: StudentListManagerProps) {
  const { t } = useLocale();
  const { showToast } = useToast();
  
  void _course;
  
  const [filter, setFilter] = useState<'all' | 'checked-in' | 'not-checked-in'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [, setIsRecording] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'normal' | 'late' | 'absent' | 'leave'>('normal');
  const [adjustmentNote, setAdjustmentNote] = useState('');

  const [students] = useState<EnrolledStudentInfo[]>(() => {
    const studentMap = new Map<string, EnrolledStudentInfo>();
    
    records.forEach(record => {
      studentMap.set(record.studentId.toString(), {
        studentId: record.studentId.toString(),
        studentName: record.studentName,
        studentNumber: record.studentNumber,
        record,
        hasFaceData: record.checkInMethod === 'face_recognition',
      });
    });

    return Array.from(studentMap.values());
  });

  const filteredStudents = useMemo(() => {
    let filtered = students;

    // Apply filter
    if (filter === 'checked-in') {
      filtered = filtered.filter(s => s.record && s.record.status !== 'absent');
    } else if (filter === 'not-checked-in') {
      filtered = filtered.filter(s => !s.record || s.record.status === 'absent');
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.studentName.toLowerCase().includes(query) ||
        (s.studentNumber && s.studentNumber.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [students, filter, searchQuery]);

  const handleRecordAttendance = async (studentId: string) => {
    setIsRecording(true);
    try {
      const response = await fetch('/api/attendance/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          sessionId: session.id || session._id?.toString(),
          status: selectedStatus,
          method: 'manual',
          note: adjustmentNote || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast({ type: 'success', message: t.attendanceManagement.recordSuccess });
        onRecordUpdated();
        setAdjustmentNote('');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error recording attendance:', error);
      showToast({ type: 'error', message: t.attendanceManagement.recordError });
    } finally {
      setIsRecording(false);
    }
  };

  const handleAdjustStatus = async (recordId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/attendance/records/${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note: adjustmentNote || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast({ type: 'success', message: t.attendanceManagement.adjustSuccess });
        onRecordUpdated();
        setAdjustmentNote('');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error adjusting status:', error);
      showToast({ type: 'error', message: t.attendanceManagement.adjustError });
    }
  };

  const getStatusBadgeClass = (status?: string) => {
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

  const getStatusText = (status?: string) => {
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
        return t.attendanceManagement.notCheckedIn;
    }
  };

  const checkedInCount = students.filter(s => s.record && s.record.status !== 'absent').length;
  const totalCount = students.length;

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
            {t.attendanceManagement.enrolledStudents}
          </h2>
          <div className="badge badge-lg">
            {checkedInCount}/{totalCount} {t.attendanceManagement.checkedIn}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          {/* Search */}
          <div className="form-control flex-1 min-w-[200px]">
            <div className="input-group">
              <input
                type="text"
                placeholder={t.attendanceManagement.searchStudent}
                className="input input-bordered w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-square">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="btn-group">
            <button
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter('all')}
            >
              {t.attendanceManagement.showAll}
            </button>
            <button
              className={`btn btn-sm ${filter === 'checked-in' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter('checked-in')}
            >
              {t.attendanceManagement.showCheckedIn}
            </button>
            <button
              className={`btn btn-sm ${filter === 'not-checked-in' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter('not-checked-in')}
            >
              {t.attendanceManagement.showNotCheckedIn}
            </button>
          </div>
        </div>

        {/* Student List */}
        {filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>{t.attendanceManagement.studentName}</th>
                  <th>{t.attendanceManagement.studentNumber}</th>
                  <th>{t.attendanceManagement.status}</th>
                  <th>{t.attendanceManagement.checkInTime}</th>
                  <th>{t.attendanceManagement.method}</th>
                  <th className="text-right">{t.attendanceManagement.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.studentId}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="avatar placeholder">
                          <div className="bg-neutral text-neutral-content rounded-full w-8">
                            <span className="text-xs">{student.studentName.charAt(0)}</span>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">{student.studentName}</div>
                          {!student.hasFaceData && (
                            <div className="text-xs text-warning">{t.attendanceManagement.noFaceData}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{student.studentNumber || '-'}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(student.record?.status)}`}>
                        {getStatusText(student.record?.status)}
                      </span>
                    </td>
                    <td>
                      {student.record?.checkInTime 
                        ? new Date(student.record.checkInTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
                        : '-'
                      }
                    </td>
                    <td>
                      {student.record?.checkInMethod === 'face_recognition' 
                        ? t.attendanceManagement.faceRecognition
                        : student.record?.checkInMethod === 'manual'
                        ? t.attendanceManagement.manual
                        : '-'
                      }
                    </td>
                    <td className="text-right">
                      <div className="dropdown dropdown-end">
                        <label tabIndex={0} className="btn btn-ghost btn-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                          </svg>
                        </label>
                        <ul tabIndex={0} className="dropdown-content z-1 menu p-2 shadow bg-base-100 rounded-box w-52">
                          {!student.record ? (
                            <>
                              <li>
                                <a onClick={() => {
                                  setSelectedStatus('normal');
                                  handleRecordAttendance(student.studentId);
                                }}>
                                  <span className="badge badge-success badge-xs"></span>
                                  {t.attendanceManagement.statusNormal}
                                </a>
                              </li>
                              <li>
                                <a onClick={() => {
                                  setSelectedStatus('late');
                                  handleRecordAttendance(student.studentId);
                                }}>
                                  <span className="badge badge-warning badge-xs"></span>
                                  {t.attendanceManagement.statusLate}
                                </a>
                              </li>
                              <li>
                                <a onClick={() => {
                                  setSelectedStatus('leave');
                                  handleRecordAttendance(student.studentId);
                                }}>
                                  <span className="badge badge-info badge-xs"></span>
                                  {t.attendanceManagement.statusLeave}
                                </a>
                              </li>
                              <li>
                                <a onClick={() => {
                                  setSelectedStatus('absent');
                                  handleRecordAttendance(student.studentId);
                                }}>
                                  <span className="badge badge-error badge-xs"></span>
                                  {t.attendanceManagement.statusAbsent}
                                </a>
                              </li>
                            </>
                          ) : (
                            <>
                              <li className="menu-title">
                                <span>{t.attendanceManagement.adjustStatus}</span>
                              </li>
                              {['normal', 'late', 'leave', 'absent'].map((status) => (
                                <li key={status}>
                                  <a 
                                    className={student.record?.status === status ? 'active' : ''}
                                    onClick={() => handleAdjustStatus(
                                      student.record?.id || student.record?._id?.toString() || '',
                                      status
                                    )}
                                  >
                                    <span className={`badge badge-xs ${getStatusBadgeClass(status)}`}></span>
                                    {getStatusText(status)}
                                  </a>
                                </li>
                              ))}
                            </>
                          )}
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mx-auto text-base-content/20 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
            <p className="text-base-content/60">
              {searchQuery 
                ? t.attendanceManagement.noRecords
                : t.attendanceManagement.noStudentsEnrolled
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
