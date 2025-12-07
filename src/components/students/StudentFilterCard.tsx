import { useLocale } from '@/hooks/useLocale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { DEPARTMENTS, GRADES, CLASSES } from '@/lib/constants';

interface StudentFilterCardProps {
  search: string;
  department: string;
  grade: string;
  studentClass: string;
  onSearchChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onGradeChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onClearFilters: () => void;
}

export default function StudentFilterCard({
  search,
  department,
  grade,
  studentClass,
  onSearchChange,
  onDepartmentChange,
  onGradeChange,
  onClassChange,
  onClearFilters
}: StudentFilterCardProps) {
  const { t } = useLocale();

  const hasFilters = search || department || grade || studentClass;

  return (
    <div className="bg-base-100 rounded-xl shadow-sm border border-base-200/50 p-1 mb-6">
      <div className="flex flex-col lg:flex-row gap-2">
        {/* Search Box */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FontAwesomeIcon icon={faSearch} className="text-base-content/40" />
          </div>
          <input
            type="text"
            className="input input-ghost w-full pl-10 focus:bg-transparent"
            placeholder={t.students.searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search && (
            <button
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/40 hover:text-base-content transition-colors"
              onClick={() => onSearchChange('')}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 p-1">
            <select 
                className="select select-ghost select-sm w-full sm:w-auto font-normal focus:bg-base-200/50"
                value={department}
                onChange={(e) => onDepartmentChange(e.target.value)}
            >
                <option value="">{t.students.department}</option>
                {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>
                        {t.register[`dept${dept}` as keyof typeof t.register] || dept}
                    </option>
                ))}
            </select>

            <select 
                className="select select-ghost select-sm w-full sm:w-auto font-normal focus:bg-base-200/50"
                 value={grade}
                 onChange={(e) => onGradeChange(e.target.value)}
            >
                <option value="">{t.students.grade}</option>
                 {GRADES.map(g => (
                    <option key={g} value={g}>
                        {t.register[`gradeYear${g}` as keyof typeof t.register] || `Year ${g}`}
                    </option>
                ))}
            </select>

            <select 
                className="select select-ghost select-sm w-full sm:w-auto font-normal focus:bg-base-200/50"
                 value={studentClass}
                 onChange={(e) => onClassChange(e.target.value)}
            >
                <option value="">{t.students.class}</option>
                 {CLASSES.map(c => (
                    <option key={c} value={c}>
                        {t.register[`class${c}` as keyof typeof t.register] || `Class ${c}`}
                    </option>
                ))}
            </select>

            {hasFilters && (
                <button 
                className="btn btn-ghost btn-sm text-error font-normal"
                onClick={onClearFilters}
                >
                {t.students.clearFilters}
                </button>
            )}
        </div>
      </div>
    </div>
  );
}
