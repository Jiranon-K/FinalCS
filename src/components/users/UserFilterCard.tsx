'use client';

import { useLocale } from '@/hooks/useLocale';

// Icons
const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 opacity-50">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const ShieldIconSmall = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
);

const AcademicCapIconSmall = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
  </svg>
);

const UserIconSmall = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

const UserPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
  </svg>
);

interface UserFilterCardProps {
  search: string;
  roleFilter: string;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: string) => void;
  onCreateUser?: () => void;
}

export default function UserFilterCard({
  search,
  roleFilter,
  onSearchChange,
  onRoleFilterChange,
  onCreateUser,
}: UserFilterCardProps) {
  const { t } = useLocale();

  return (
    <div className="card bg-base-100 shadow-lg mb-8">
      <div className="card-body">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="card-title text-base-content">
            <FilterIcon />
            {t.users.filterByRole}
          </h2>
          {onCreateUser && (
            <button
              className="btn btn-primary btn-sm sm:btn-md gap-2"
              onClick={onCreateUser}
            >
              <UserPlusIcon />
              {t.users.createUser}
            </button>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input with Icon */}
          <div className="form-control flex-1">
            <label className="input input-bordered flex items-center gap-2 focus-within:input-primary">
              <SearchIcon />
              <input
                type="text"
                placeholder={t.users.searchPlaceholder}
                className="grow bg-transparent"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {search && (
                <button 
                  className="btn btn-ghost btn-xs btn-circle"
                  onClick={() => onSearchChange('')}
                >
                  <CloseIcon />
                </button>
              )}
            </label>
          </div>

          {/* Role Filter - Tab Style */}
          <div className="join">
            <button 
              className={`join-item btn ${roleFilter === '' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => onRoleFilterChange('')}
            >
              {t.users.allRoles}
            </button>
            <button 
              className={`join-item btn ${roleFilter === 'admin' ? 'btn-error' : 'btn-ghost'}`}
              onClick={() => onRoleFilterChange('admin')}
            >
              <ShieldIconSmall />
              {t.users.roleAdmin}
            </button>
            <button 
              className={`join-item btn ${roleFilter === 'teacher' ? 'btn-info' : 'btn-ghost'}`}
              onClick={() => onRoleFilterChange('teacher')}
            >
              <AcademicCapIconSmall />
              {t.users.roleTeacher}
            </button>
            <button 
              className={`join-item btn ${roleFilter === 'student' ? 'btn-success' : 'btn-ghost'}`}
              onClick={() => onRoleFilterChange('student')}
            >
              <UserIconSmall />
              {t.users.roleStudent}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
