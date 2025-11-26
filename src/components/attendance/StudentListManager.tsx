'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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

interface SearchStudentResult {
  _id: string;
  name: string;
  studentId: string;
  imageUrl?: string;
  imageKey?: string;
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

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchStudentResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudentsToEnroll, setSelectedStudentsToEnroll] = useState<string[]>([]);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const addModalRef = useRef<HTMLDialogElement>(null);

  const [studentToRemove, setStudentToRemove] = useState<EnrolledStudentInfo | null>(null);
  const deleteModalRef = useRef<HTMLDialogElement>(null);

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

  useEffect(() => {
    fetchEnrolledStudents();
  }, [course, showToast]);

  useEffect(() => {
    const searchStudents = async () => {
      if (!studentSearchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/students?search=${encodeURIComponent(studentSearchQuery)}&limit=10`);
        const data = await response.json();
        if (data.success) {
          const enrolledIds = new Set(enrolledStudents.map(s => s._id.toString()));
          const filtered = data.data.filter((s: any) => !enrolledIds.has(s._id.toString()));
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error('Error searching students:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchStudents, 500);
    return () => clearTimeout(timeoutId);
  }, [studentSearchQuery, enrolledStudents]);

  const students = useMemo(() => {
    const studentMap = new Map<string, EnrolledStudentInfo>();
    
    enrolledStudents.forEach(student => {
      const id = student._id.toString();
      studentMap.set(id, {
        studentId: id,
        studentName: student.name,
        studentNumber: student.studentId,
        hasFaceData: !!student.imageKey || !!student.imageUrl,
        imageUrl: student.imageUrl,
      });
    });
    
    records.forEach(record => {
      let existing = studentMap.get(record.studentId.toString());
      
      if (!existing && record.studentNumber) {
        for (const student of studentMap.values()) {
          if (student.studentNumber === record.studentNumber) {
            existing = student;
            break;
          }
        }
      }

      if (existing) {
        existing.record = record;
        if (!existing.hasFaceData && record.checkInMethod === 'face_recognition') {
           existing.hasFaceData = true;
        }
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
              note: t.attendanceManagement.markAllPresentNote,
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
              note: t.attendanceManagement.markRemainingAbsentNote,
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

  const handleEnrollStudents = async () => {
    if (selectedStudentsToEnroll.length === 0) return;

    setIsEnrolling(true);
    try {
      const courseId = course.id || course._id?.toString();
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: selectedStudentsToEnroll }),
      });
      const data = await response.json();

      if (data.success) {
        showToast({ type: 'success', message: t.course.enrollSuccess });
        setSelectedStudentsToEnroll([]);
        setStudentSearchQuery('');
        setIsAddModalOpen(false);
        addModalRef.current?.close();
        fetchEnrolledStudents();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error enrolling students:', error);
      showToast({ type: 'error', message: error.message || t.course.createError });
    } finally {
      setIsEnrolling(false);
    }
  };

  const confirmUnenrollStudent = (student: EnrolledStudentInfo) => {
    setStudentToRemove(student);
    deleteModalRef.current?.showModal();
  };

  const handleUnenrollStudent = async () => {
    if (!studentToRemove) return;

    try {
      const courseId = course.id || course._id?.toString();
      const response = await fetch(`/api/courses/${courseId}/unenroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: [studentToRemove.studentId] }),
      });
      const data = await response.json();

      if (data.success) {
        showToast({ type: 'success', message: t.course.unenrollSuccess });
        fetchEnrolledStudents();
        setStudentToRemove(null);
        deleteModalRef.current?.close();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error unenrolling student:', error);
      showToast({ type: 'error', message: error.message || t.course.deleteError });
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'normal': return 'badge-success text-white';
      case 'late': return 'badge-warning text-white';
      case 'absent': return 'badge-error text-white';
      case 'leave': return 'badge-info text-white';
      default: return 'badge-ghost';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'normal': return t.attendanceManagement.statusNormal;
      case 'late': return t.attendanceManagement.statusLate;
      case 'absent': return t.attendanceManagement.statusAbsent;
      case 'leave': return t.attendanceManagement.statusLeave;
      default: return t.attendanceManagement.notCheckedIn;
    }
  };

  const checkedInCount = students.filter(s => s.record && s.record.status !== 'absent').length;
  const totalCount = students.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-base-100 p-4 rounded-xl shadow-sm border border-base-200">
        <div className="flex items-center gap-4">
          <div className="radial-progress text-primary" style={{ "--value": totalCount > 0 ? (checkedInCount / totalCount) * 100 : 0 } as any} role="progressbar">
            {totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0}%
          </div>
          <div>
            <h3 className="font-bold text-lg">{t.attendanceManagement.attendanceStats}</h3>
            <p className="text-sm text-base-content/70">
              {checkedInCount} / {totalCount} {t.attendanceManagement.checkedIn}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
           <button 
            className="btn btn-primary btn-sm flex-1 lg:flex-none"
            onClick={() => router.push(`/camera?sessionId=${session.id || session._id?.toString()}&courseId=${course.id || course._id?.toString()}`)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
            {t.camera.start}
          </button>
          
          <button 
            className="btn btn-outline btn-sm flex-1 lg:flex-none"
            onClick={() => {
              setIsAddModalOpen(true);
              addModalRef.current?.showModal();
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3.75 15a2.25 2.25 0 0 1 2.25-2.25h.75a2.25 2.25 0 0 1 2.25 2.25v.75a2.25 2.25 0 0 1-2.25 2.25h-.75a2.25 2.25 0 0 1-2.25-2.25v-.75Z" />
            </svg>
            {t.course.addStudent}
          </button>
        </div>
      </div>



      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="join w-full sm:w-auto">
          <button 
            className={`join-item btn btn-sm ${filter === 'all' ? 'btn-active btn-neutral' : ''}`}
            onClick={() => setFilter('all')}
          >
            {t.attendanceManagement.showAll}
          </button>
          <button 
            className={`join-item btn btn-sm ${filter === 'checked-in' ? 'btn-active btn-success text-white' : ''}`}
            onClick={() => setFilter('checked-in')}
          >
            {t.attendanceManagement.showCheckedIn}
          </button>
          <button 
            className={`join-item btn btn-sm ${filter === 'not-checked-in' ? 'btn-active btn-error text-white' : ''}`}
            onClick={() => setFilter('not-checked-in')}
          >
            {t.attendanceManagement.showNotCheckedIn}
          </button>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder={t.attendanceManagement.searchStudent}
              className="input input-bordered input-sm w-full pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          
          
        </div>
      </div>

      {loadingStudents ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : filteredStudents.length > 0 ? (
        <div className="overflow-x-auto bg-base-100 rounded-box shadow border border-base-200">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200/50 text-base-content/70 uppercase text-xs tracking-wider">
                <th className="w-16 text-center">#</th>
                <th>{t.attendanceManagement.studentName}</th>
                <th className="text-center">{t.attendanceManagement.checkInTime}</th>
                <th className="text-center w-48">{t.attendanceManagement.status}</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => (
                <tr key={student.studentId} className="group hover:bg-base-200/30 transition-colors">
                  <td className="text-center font-mono text-xs opacity-50">
                    {index + 1}
                  </td>
                  <td>
                    <div className="flex items-center gap-4">
                      <div className="avatar">
                        <div className="w-12 h-12 rounded-full ring ring-base-200 ring-offset-base-100 ring-offset-1">
                          {student.imageUrl ? (
                            <Image
                              src={student.imageUrl}
                              alt={student.studentName}
                              width={48}
                              height={48}
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="bg-neutral text-neutral-content w-full h-full flex items-center justify-center text-lg font-bold">
                              {student.studentName.charAt(0)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base-content">{student.studentName}</span>
                          <button 
                            className="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100 transition-opacity text-error"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmUnenrollStudent(student);
                            }}
                            title={t.course.removeStudent}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                        <span className="text-xs text-base-content/50 font-mono">{student.studentNumber || '-'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="text-center">
                    {student.record?.checkInTime ? (
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-sm font-medium">
                          {new Date(student.record.checkInTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider opacity-50 badge badge-ghost badge-xs mt-1">
                          {student.record.checkInMethod === 'face_recognition' ? 'Face' : 'Manual'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-base-content/30">-</span>
                    )}
                  </td>
                  <td className="text-center">
                    <select 
                      className={`select select-sm w-full max-w-[140px] font-medium ${
                        student.record?.status === 'normal' ? 'select-success text-success-content' :
                        student.record?.status === 'late' ? 'select-warning text-warning-content' :
                        student.record?.status === 'leave' ? 'select-info text-info-content' :
                        student.record?.status === 'absent' ? 'select-error text-error-content' :
                        'select-bordered'
                      }`}
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
        <div className="text-center py-12 bg-base-100 rounded-xl border border-base-200 border-dashed">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mx-auto text-base-content/20 mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
          <p className="text-base-content/60">
            {searchQuery 
              ? t.attendanceManagement.noRecords
              : t.attendanceManagement.noStudentsEnrolled
            }
          </p>
          {!searchQuery && (
             <button 
              className="btn btn-primary btn-sm mt-4"
              onClick={() => {
                setIsAddModalOpen(true);
                addModalRef.current?.showModal();
              }}
            >
              {t.course.addStudent}
            </button>
          )}
        </div>
      )}

      <dialog ref={addModalRef} className="modal">
        <div className="modal-box w-11/12 max-w-3xl h-[600px] flex flex-col">
          <h3 className="font-bold text-lg mb-4">{t.course.addStudentToCourse}</h3>
          
          <div className="form-control w-full mb-4">
            <input 
              type="text" 
              placeholder={t.course.searchStudentsToEnroll} 
              className="input input-bordered w-full" 
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 border rounded-lg p-2 mb-4">
            {isSearching ? (
              <div className="flex justify-center items-center h-full">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : searchResults.length > 0 ? (
              <table className="table table-pin-rows">
                <thead>
                  <tr>
                    <th>
                      <label>
                        <input type="checkbox" className="checkbox" disabled />
                      </label>
                    </th>
                    <th>{t.attendanceManagement.studentName}</th>
                    <th>{t.attendanceManagement.studentNumber}</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((student) => (
                    <tr key={student._id} className="hover">
                      <th>
                        <label>
                          <input 
                            type="checkbox" 
                            className="checkbox" 
                            checked={selectedStudentsToEnroll.includes(student._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentsToEnroll(prev => [...prev, student._id]);
                              } else {
                                setSelectedStudentsToEnroll(prev => prev.filter(id => id !== student._id));
                              }
                            }}
                          />
                        </label>
                      </th>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            <div className="mask mask-squircle w-10 h-10">
                              {student.imageUrl ? (
                                <Image src={student.imageUrl} alt={student.name} width={40} height={40} unoptimized />
                              ) : (
                                <div className="bg-neutral text-neutral-content w-full h-full flex items-center justify-center">
                                  {student.name.charAt(0)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="font-bold">{student.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>{student.studentId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : studentSearchQuery ? (
              <div className="flex justify-center items-center h-full text-base-content/50">
                {t.course.noStudentsFoundSearch}
              </div>
            ) : (
              <div className="flex justify-center items-center h-full text-base-content/50">
                {t.course.searchStudentsToEnroll}
              </div>
            )}
          </div>

          <div className="modal-action">
            <form method="dialog">
              <button className="btn mr-2" onClick={() => {
                setIsAddModalOpen(false);
                setStudentSearchQuery('');
                setSelectedStudentsToEnroll([]);
              }}>{t.common.cancel}</button>
            </form>
            <button 
              className="btn btn-primary"
              disabled={selectedStudentsToEnroll.length === 0 || isEnrolling}
              onClick={handleEnrollStudents}
            >
              {isEnrolling && <span className="loading loading-spinner loading-xs"></span>}
              {t.course.enrollSelected} ({selectedStudentsToEnroll.length})
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => {
             setIsAddModalOpen(false);
             setStudentSearchQuery('');
             setSelectedStudentsToEnroll([]);
          }}>close</button>
        </form>
      </dialog>

      <dialog ref={deleteModalRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-error">{t.course.removeStudentFromCourse}</h3>
          <p className="py-4">
            {t.course.confirmRemoveStudent}
            <br />
            <span className="font-bold mt-2 block">{studentToRemove?.studentName}</span>
          </p>
          <div className="modal-action">
            <form method="dialog">
              <button 
                className="btn mr-2" 
                onClick={() => setStudentToRemove(null)}
              >
                {t.common.cancel}
              </button>
            </form>
            <button 
              className="btn btn-error text-white" 
              onClick={handleUnenrollStudent}
            >
              {t.common.remove || 'Remove'}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setStudentToRemove(null)}>close</button>
        </form>
      </dialog>
    </div>
  );
}


