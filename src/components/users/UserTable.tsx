'use client';

import Image from 'next/image';
import { useLocale } from '@/hooks/useLocale';

// Role Icons
export const ShieldIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
);

export const AcademicCapIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
  </svg>
);

export const UserIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

const ViewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const UsersGroupIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>
);

export interface User {
  _id: string;
  username: string;
  fullName?: string;
  role: 'student' | 'teacher' | 'admin';
  imageUrl?: string;
  imageKey?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserTableProps {
  users: User[];
  loading: boolean;
  hasFilters: boolean;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onClearFilters: () => void;
}

// Helper functions
const getRoleBadgeClass = (role: string) => {
  const colorMap: Record<string, string> = {
    'admin': 'badge-error',
    'teacher': 'badge-info',
    'student': 'badge-success',
  };
  return colorMap[role] || 'badge-neutral';
};

const getAvatarColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-error text-error-content';
    case 'teacher':
      return 'bg-info text-info-content';
    default:
      return 'bg-success text-success-content';
  }
};

const RoleIcon = ({ role }: { role: string }) => {
  switch (role) {
    case 'admin':
      return <ShieldIcon />;
    case 'teacher':
      return <AcademicCapIcon />;
    default:
      return <UserIcon />;
  }
};

export default function UserTable({
  users,
  loading,
  hasFilters,
  onView,
  onEdit,
  onDelete,
  onClearFilters,
}: UserTableProps) {
  const { t } = useLocale();

  const getRoleTranslation = (role: string) => {
    const roleMap: Record<string, string> = {
      'admin': t.users.roleAdmin,
      'teacher': t.users.roleTeacher,
      'student': t.users.roleStudent,
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return (
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-0">
          <div className="flex flex-col justify-center items-center py-20 gap-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-base-content/60">{t.users.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-0">
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="avatar placeholder">
              <div className="bg-base-300 text-base-content/40 rounded-full w-24 h-24 flex items-center justify-center">
                <UsersGroupIcon />
              </div>
            </div>
            <p className="text-base-content/50 text-lg">{t.users.noUsers}</p>
            {hasFilters && (
              <button 
                className="btn btn-primary btn-sm"
                onClick={onClearFilters}
              >
                {t.users.clearFilters}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body p-0">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr className="bg-base-200">
                <th className="text-base-content font-bold">
                  {t.users.profilePicture}
                </th>
                <th className="text-base-content font-bold">
                  {t.users.username}
                </th>
                <th className="text-base-content font-bold">
                  {t.users.role}
                </th>
                <th className="text-base-content font-bold">
                  {t.users.createdAt}
                </th>
                <th className="text-base-content font-bold text-right">
                  {t.users.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((userItem) => (
                <tr
                  key={userItem._id}
                  className="hover:bg-base-200/50 transition-colors"
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="mask mask-squircle w-12 h-12">
                          {userItem.imageUrl ? (
                            <Image
                              src={userItem.imageUrl}
                              alt={userItem.username}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          ) : (
                            <div className={`${getAvatarColor(userItem.role)} w-full h-full flex items-center justify-center font-bold text-lg`}>
                              {userItem.username.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="font-bold text-base-content">
                        {userItem.fullName || userItem.username}
                      </span>
                      <span className="text-xs text-base-content/50">
                        {userItem.username}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className={`badge gap-1 ${getRoleBadgeClass(userItem.role)}`}>
                      <RoleIcon role={userItem.role} />
                      {getRoleTranslation(userItem.role)}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="text-base-content">
                        {new Date(userItem.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="text-xs text-base-content/50">
                        {new Date(userItem.createdAt).toLocaleTimeString('th-TH', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <div className="tooltip" data-tip={t.users.view}>
                        {/* <button
                          className="btn btn-ghost btn-sm btn-square text-primary"
                          onClick={() => onView(userItem)}
                        >
                          <ViewIcon />
                        </button> */}
                      </div>
                      <div className="tooltip" data-tip={t.users.edit}>
                        <button
                          className="btn btn-ghost btn-sm btn-square text-warning"
                          onClick={() => onEdit(userItem)}
                        >
                          <EditIcon />
                        </button>
                      </div>
                      <div className="tooltip" data-tip={t.users.delete}>
                        <button
                          className="btn btn-ghost btn-sm btn-square text-error"
                          onClick={() => onDelete(userItem._id)}
                        >
                          <DeleteIcon />
                        </button>
                      </div>
                    </div>
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
