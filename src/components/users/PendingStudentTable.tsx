'use client';

import { useLocale } from '@/hooks/useLocale';
import { getSafeRegisterString } from '@/utils/translation';
import { Student } from '@/types/student';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faClock } from '@fortawesome/free-solid-svg-icons';

interface PendingStudentTableProps {
  students: Student[];
  loading: boolean;
  onActivate: (student: Student) => void;
  activatingId: string | null;
}

export default function PendingStudentTable({
  students,
  loading,
  onActivate,
  activatingId
}: PendingStudentTableProps) {
  const { t } = useLocale();

  if (loading) {
    return (
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-0">
          <div className="flex flex-col justify-center items-center py-20 gap-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-base-content/60">{t.students.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-0">
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center text-base-content/30">
              <FontAwesomeIcon icon={faCheckCircle} className="text-3xl" />
            </div>
            <p className="text-base-content/50 text-lg">No pending activations</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-200/50">
      <table className="table w-full">
        <thead>
          <tr className="border-b-base-200/50 font-medium text-base-content/60">
            <th className="py-4 normal-case font-medium">{t.students.name}</th>
            <th className="py-4 normal-case font-medium">{t.students.studentId}</th>
            <th className="py-4 normal-case font-medium">{t.students.department}</th>
            <th className="py-4 normal-case font-medium">{t.users.status}</th>
            <th className="py-4 normal-case font-medium text-right">{t.users.actions}</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student._id} className="hover:bg-base-200/30 transition-colors border-b-base-200/50 last:border-none">
              <td className="py-3">
                <div className="font-medium text-base-content">{student.name}</div>
                {student.email && <div className="text-xs text-base-content/50">{student.email}</div>}
              </td>
              <td className="py-3 font-mono text-sm opacity-80">
                {student.studentId}
              </td>
              <td className="py-3">
                {student.department ? (
                  <div className="badge badge-sm badge-ghost font-normal text-xs gap-1">
                    {getSafeRegisterString(t.register, `dept${student.department}`) || student.department}
                  </div>
                ) : (
                  <span className="text-base-content/30 text-xs">-</span>
                )}
              </td>
              <td className="py-3">
                <div className="badge badge-warning badge-sm gap-1">
                  <FontAwesomeIcon icon={faClock} className="text-xs" />
                  {t.users.statusPending}
                </div>
              </td>
              <td className="py-3 text-right">
                <button
                  className="btn btn-primary btn-sm gap-2"
                  onClick={() => onActivate(student)}
                  disabled={activatingId === student._id}
                >
                  {activatingId === student._id ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <FontAwesomeIcon icon={faCheckCircle} />
                  )}
                  {t.users.activate}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
