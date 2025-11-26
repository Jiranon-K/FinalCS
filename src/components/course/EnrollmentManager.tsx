'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import { Course, EnrolledStudent } from '@/types/course';

interface Student {
  _id: string;
  name: string;
  studentId?: string;
  imageUrl?: string;
}

interface EnrollmentManagerProps {
  course: Course;
  onUpdate: () => void;
}

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

export default function EnrollmentManager({ course, onUpdate }: EnrollmentManagerProps) {
  const { t } = useLocale();
  const { showToast } = useToast();

  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [unenrolling, setUnenrolling] = useState<string | null>(null);

  useEffect(() => {
    if (showAddModal) {
      fetchAllStudents();
    }
  }, [showAddModal]);

  const fetchAllStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await fetch('/api/students');
      const result = await response.json();
      if (result.success) {
        setAllStudents(result.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const enrolledStudentIds = course.enrolledStudents.map((e) =>
    e.studentId.toString()
  );

  const availableStudents = allStudents.filter(
    (s) => !enrolledStudentIds.includes(s._id)
  );

  const filteredStudents = availableStudents.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.studentId && s.studentId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleEnrollStudents = async () => {
    if (selectedStudents.length === 0) {
      showToast({ message: t.course.selectStudents, type: 'warning' });
      return;
    }

    try {
      setEnrolling(true);
      const response = await fetch(
        `/api/courses/${course._id?.toString() || course.id}/enroll`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentIds: selectedStudents }),
        }
      );

      const result = await response.json();

      if (result.success) {
        showToast({ message: t.course.enrollSuccess, type: 'success' });
        setSelectedStudents([]);
        setShowAddModal(false);
        onUpdate();
      } else {
        throw new Error(result.error || t.course.createError);
      }
    } catch (error) {
      console.error('Error enrolling students:', error);
      showToast({
        message: error instanceof Error ? error.message : t.course.createError,
        type: 'error',
      });
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenrollStudent = async (studentId: string) => {
    try {
      setUnenrolling(studentId);
      const response = await fetch(
        `/api/courses/${course._id?.toString() || course.id}/unenroll`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentIds: [studentId] }),
        }
      );

      const result = await response.json();

      if (result.success) {
        showToast({ message: t.course.unenrollSuccess, type: 'success' });
        onUpdate();
      } else {
        throw new Error(result.error || t.course.deleteError);
      }
    } catch (error) {
      console.error('Error unenrolling student:', error);
      showToast({
        message: error instanceof Error ? error.message : t.course.deleteError,
        type: 'error',
      });
    } finally {
      setUnenrolling(null);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <h3 className="card-title">
            {t.course.enrolledStudents}
            <span className="badge badge-primary">{course.enrolledStudents.length}</span>
          </h3>
          <button
            className="btn btn-primary btn-sm gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <PlusIcon />
            {t.course.addStudent}
          </button>
        </div>

        {course.enrolledStudents.length === 0 ? (
          <p className="text-center text-base-content/50 py-8">{t.course.noStudents}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr className="bg-base-200">
                  <th>#</th>
                  <th>{t.attendanceManagement.studentName}</th>
                  <th>{t.attendanceManagement.enrolledAt}</th>
                  <th className="text-right">{t.attendanceManagement.actions}</th>
                </tr>
              </thead>
              <tbody>
                {course.enrolledStudents.map((enrollment, idx) => (
                  <tr key={enrollment.studentId.toString()}>
                    <td>{idx + 1}</td>
                    <td>
                      <div className="font-semibold">
                        {allStudents.find((s) => s._id === enrollment.studentId.toString())?.name || '-'}
                      </div>
                      <div className="text-xs text-base-content/50">
                        {allStudents.find((s) => s._id === enrollment.studentId.toString())?.studentId || '-'}
                      </div>
                    </td>
                    <td>{formatDate(enrollment.enrolledAt)}</td>
                    <td>
                      <div className="flex justify-end">
                        <button
                          className="btn btn-error btn-sm btn-square"
                          onClick={() => handleUnenrollStudent(enrollment.studentId.toString())}
                          disabled={unenrolling === enrollment.studentId.toString()}
                        >
                          {unenrolling === enrollment.studentId.toString() ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <TrashIcon />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl">{t.course.addStudent}</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedStudents([]);
                }}
                className="btn btn-ghost btn-sm btn-circle"
                disabled={enrolling}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="form-control mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.course.searchPlaceholder}
                  className="input input-bordered w-full pl-10"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50">
                  <SearchIcon />
                </div>
              </div>
            </div>

            {loadingStudents ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : (
              <div className="border border-base-300 rounded-lg p-3 max-h-80 overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <p className="text-center text-base-content/50 py-4">
                    {t.course.noStudents}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredStudents.map((student) => (
                      <label
                        key={student._id}
                        className="flex items-center gap-3 p-2 hover:bg-base-200 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student._id)}
                          onChange={() => toggleStudentSelection(student._id)}
                          className="checkbox checkbox-primary"
                          disabled={enrolling}
                        />
                        <div className="flex-1">
                          <div className="font-semibold">{student.name}</div>
                          {student.studentId && (
                            <div className="text-xs text-base-content/50">
                              {student.studentId}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="modal-action">
              <p className="flex-1 text-sm text-base-content/60">
                {selectedStudents.length} {t.course.selected}
              </p>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedStudents([]);
                }}
                disabled={enrolling}
              >
                {t.common.cancel}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleEnrollStudents}
                disabled={enrolling || selectedStudents.length === 0}
              >
                {enrolling ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    {t.common.saving}
                  </>
                ) : (
                  t.course.addStudent
                )}
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => {
              setShowAddModal(false);
              setSelectedStudents([]);
            }}
          ></div>
        </div>
      )}
    </div>
  );
}
