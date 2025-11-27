import { useLocale } from '@/hooks/useLocale';

interface AtRiskStudent {
  id: string;
  name: string;
  studentId: string;
  rate: number;
  totalClasses: number;
  missed: number;
}

interface AtRiskStudentsListProps {
  students: AtRiskStudent[];
}

export default function AtRiskStudentsList({ students }: AtRiskStudentsListProps) {
  const { t } = useLocale();

  if (!students || students.length === 0) {
    return (
      <div className="card bg-base-100 shadow-sm border border-base-200 h-full">
        <div className="card-body p-4">
          <h3 className="card-title text-lg mb-4">{t.attendanceManagement.atRiskStudents || 'At Risk Students'}</h3>
          <div className="flex flex-col items-center justify-center h-40 text-base-content/60">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2 opacity-50">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p>{t.attendanceManagement.noAtRiskStudents || 'Great! No students at risk.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200 h-full">
      <div className="card-body p-4">
        <h3 className="card-title text-lg mb-4 flex justify-between items-center">
          {t.attendanceManagement.atRiskStudents || 'At Risk Students'}
          <div className="badge badge-error gap-1 text-white">
            {students.length}
          </div>
        </h3>
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>{t.common?.student || 'Student'}</th>
                <th className="text-center">{t.attendanceManagement.attendanceRate || 'Rate'}</th>
                <th className="text-right">{t.attendanceManagement.missed || 'Missed'}</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-base-200/50">
                  <td>
                    <div className="font-medium">{student.name}</div>
                    <div className="text-xs text-base-content/60">{student.studentId}</div>
                  </td>
                  <td className="text-center">
                    <div className="radial-progress text-error text-xs" style={{ "--value": student.rate, "--size": "2rem" } as any}>
                      {Math.round(student.rate)}%
                    </div>
                  </td>
                  <td className="text-right font-medium text-error">
                    {student.missed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
