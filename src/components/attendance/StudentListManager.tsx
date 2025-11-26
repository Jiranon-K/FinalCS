'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  imageUrl?: string;
}

export default function StudentListManager({
  course,
  session,
  records,
  onRecordUpdated,
}: StudentListManagerProps) {
  const { t } = useLocale();
  const { showToast } = useToast();
  const router = useRouter();
  
  const [filter, setFilter] = useState<'all' | 'checked-in' | 'not-checked-in'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    const fetchEnrolledStudents = async () => {
      if (!course.id && !course._id) return;
      
      setLoadingStudents(true);
      try {
        const courseId = course.id || course._id?.toString();
        const response = await fetch(`/api/courses/${courseId}/students`);
        const data = await response.json();
        
        if (data.success) {
          setEnrolledStudents(data.data);
        }
      } catch (error) {
        console.error('Error fetching enrolled students:', error);
        showToast({ type: 'error', message: 'Failed to load student list' });
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchEnrolledStudents();
  }, [course, showToast]);

  const students = useMemo(() => {
    const studentMap = new Map<string, EnrolledStudentInfo>();
    
    enrolledStudents.forEach(student => {
      studentMap.set(student._id.toString(), {
        studentId: student._id.toString(),
        studentName: student.name,
        studentNumber: student.studentId,
        hasFaceData: !!student.imageKey || !!student.imageUrl,
        imageUrl: student.imageUrl,
      });
    });
    
    records.forEach(record => {
      const existing = studentMap.get(record.studentId.toString());
      if (existing) {
        existing.record = record;
      } else {
        studentMap.set(record.studentId.toString(), {
          studentId: record.studentId.toString(),
          studentName: record.studentName,
          studentNumber: record.studentNumber,
          record,
          hasFaceData: record.checkInMethod === 'face_recognition',
        });
      }
    });

    return Array.from(studentMap.values());
  }, [enrolledStudents, records]);


  const filteredStudents = useMemo(() => {
    let filtered = students;

    if (filter === 'checked-in') {
      filtered = filtered.filter(s => s.record && s.record.status !== 'absent');
    } else if (filter === 'not-checked-in') {
      filtered = filtered.filter(s => !s.record || s.record.status === 'absent');
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.studentName.toLowerCase().includes(query) ||
        (s.studentNumber && s.studentNumber.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [students, filter, searchQuery]);

  const handleRecordAttendance = async (studentId: string, status: string) => {
    setIsRecording(true);
    try {
      const response = await fetch('/api/attendance/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          sessionId: session.id || session._id?.toString(),
          status,
          method: 'manual',
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast({ type: 'success', message: t.attendanceManagement.recordSuccess });
        onRecordUpdated();
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

  const handleMarkAllPresent = async () => {
    if (!confirm(t.attendanceManagement.confirmMarkAllPresent || 'Mark all students as present?')) return;
    
    setIsRecording(true);
    try {
      const studentsToMark = students.filter(s => !s.record);
      
      const batchSize = 5;
      for (let i = 0; i < studentsToMark.length; i += batchSize) {
        const batch = studentsToMark.slice(i, i + batchSize);
        await Promise.all(batch.map(student => 
          fetch('/api/attendance/records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentId: student.studentId,
              sessionId: session.id || session._id?.toString(),
              status: 'normal',
              method: 'manual',
              note: 'Bulk action: Mark All Present',
            }),
          })
        ));
      }

      showToast({ type: 'success', message: t.attendanceManagement.recordSuccess });
      onRecordUpdated();
    } catch (error) {
      console.error('Error marking all present:', error);
      showToast({ type: 'error', message: t.attendanceManagement.recordError });
    } finally {
      setIsRecording(false);
    }
  };

  const handleMarkRemainingAbsent = async () => {
    if (!confirm(t.attendanceManagement.confirmMarkRemainingAbsent || 'Mark remaining students as absent?')) return;

    setIsRecording(true);
    try {
      const studentsToMark = students.filter(s => !s.record);
      
      const batchSize = 5;
      for (let i = 0; i < studentsToMark.length; i += batchSize) {
        const batch = studentsToMark.slice(i, i + batchSize);
        await Promise.all(batch.map(student => 
          fetch('/api/attendance/records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentId: student.studentId,
              sessionId: session.id || session._id?.toString(),
              status: 'absent',
              method: 'manual',
              note: 'Bulk action: Mark Remaining Absent',
            }),
          })
        ));
      }

      showToast({ type: 'success', message: t.attendanceManagement.recordSuccess });
      onRecordUpdated();
    } catch (error) {
      console.error('Error marking remaining absent:', error);
      showToast({ type: 'error', message: t.attendanceManagement.recordError });
    } finally {
      setIsRecording(false);
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
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
            {t.attendanceManagement.enrolledStudents}
            {loadingStudents && <span className="loading loading-spinner loading-sm ml-2"></span>}
          </h2>
          <div className="flex gap-2">
             <button 
              className="btn btn-primary btn-sm"
              onClick={() => router.push(`/camera?sessionId=${session.id || session._id?.toString()}&courseId=${course.id || course._id?.toString()}`)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
              Open Camera
            </button>
            <div className="badge badge-lg">
              {checkedInCount}/{totalCount} {t.attendanceManagement.checkedIn}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button 
            className="btn btn-success btn-sm text-white"
            onClick={handleMarkAllPresent}
            disabled={isRecording || students.every(s => s.record)}
          >
            Mark All Present
          </button>
          <button 
            className="btn btn-error btn-sm text-white"
            onClick={handleMarkRemainingAbsent}
            disabled={isRecording || students.every(s => s.record)}
          >
            Mark Remaining Absent
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
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
                    <td>
                      <select 
                        className="select select-bordered select-xs w-full max-w-xs"
                        value={student.record?.status || ''}
                        onChange={(e) => handleRecordAttendance(student.studentId, e.target.value)}
                        disabled={isRecording}
                      >
                        <option value="" disabled>{t.attendanceManagement.recordAttendance}</option>
                        <option value="normal">{t.attendanceManagement.statusNormal}</option>
                        <option value="late">{t.attendanceManagement.statusLate}</option>
                        <option value="absent">{t.attendanceManagement.statusAbsent}</option>
                        <option value="leave">{t.attendanceManagement.statusLeave}</option>
                      </select>
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
