'use client';

import Image from 'next/image';
import { useLocale } from '@/hooks/useLocale';

// Icons




const UsersGroupIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>
);

export interface Student {
  _id: string;
  name: string;
  studentId: string;
  email?: string;
  phone?: string;
  department?: string;
  grade?: string;
  class?: string;
  imageUrl?: string;
  createdAt: string;
}

interface StudentTableProps {
  students: Student[];
  loading: boolean;
  onView?: (student: Student) => void;
}

export default function StudentTable({
  students,
  loading,
  onView,
}: StudentTableProps) {
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
            <div className="avatar placeholder">
              <div className="bg-base-300 text-base-content/40 rounded-full w-24 h-24 flex items-center justify-center">
                <UsersGroupIcon />
              </div>
            </div>
            <p className="text-base-content/50 text-lg">{t.students.noStudents}</p>
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
            <th className="py-4 normal-case font-medium">{t.users.profilePicture}</th>
            <th className="py-4 normal-case font-medium">{t.students.name}</th>
            <th className="py-4 normal-case font-medium">{t.students.studentId}</th>
            <th className="py-4 normal-case font-medium">{t.students.department}</th>
            <th className="py-4 normal-case font-medium">{t.students.grade}</th>
            <th className="py-4 normal-case font-medium">{t.students.class}</th>
            <th className="py-4 normal-case font-medium text-right">{t.students.actions}</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student._id} className="hover:bg-base-200/30 transition-colors border-b-base-200/50 last:border-none">
              <td className="py-3">
                <div className="avatar">
                  <div className="mask mask-squircle w-10 h-10 bg-base-200">
                    {student.imageUrl ? (
                      <Image
                        src={student.imageUrl}
                        alt={student.name}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-lg text-primary/40">
                        {student.name.substring(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-3">
                <div className="font-medium text-base-content">{student.name}</div>
                <div className="text-xs text-base-content/50">{student.email}</div>
              </td>
              <td className="py-3 font-mono text-sm opacity-80">
                {student.studentId}
              </td>
              <td className="py-3">
                 {student.department ? (
                    <div className="badge badge-sm badge-ghost font-normal text-xs gap-1">
                       {t.register[`dept${student.department}` as keyof typeof t.register] || student.department}
                    </div>
                ) : (
                  <span className="text-base-content/30 text-xs">-</span>
                )}
              </td>
              <td className="py-3">
                {student.grade ? (
                    <span className="text-xs badge badge-xs badge-neutral badge-outline opacity-60">
                        {t.register[`grade${student.grade}` as keyof typeof t.register] || student.grade}
                    </span>
                ) : (
                    <span className="text-base-content/30 text-xs">-</span>
                )}
              </td>
              <td className="py-3">
                {student.class ? (
                    <span className="text-xs opacity-70">
                    {t.register[`class${student.class}` as keyof typeof t.register] || student.class}
                    </span>
                ) : (
                    <span className="text-base-content/30 text-xs">-</span>
                )}
              </td>
              <td className="py-3 text-right">
                <button 
                  className="btn btn-ghost btn-xs opacity-50 hover:opacity-100"
                  onClick={() => onView?.(student)}
                >
                   {t.students.view}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
