"use client";

import Image from "next/image";
import { useLocale } from "@/hooks/useLocale";

import {
  ShieldIcon,
  AcademicCapIcon,
  UserIcon,
  ViewIcon,
  EditIcon,
  DeleteIcon,
  UsersGroupIcon,
} from "@/components/common/Icons";
import { User } from "@/types/user";

interface UserTableProps {
  users: User[];
  loading: boolean;
  hasFilters: boolean;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onClearFilters: () => void;
}

const getRoleBadgeClass = (role: string) => {
  const colorMap: Record<string, string> = {
    admin: "badge-error",
    teacher: "badge-info",
    student: "badge-success",
  };
  return colorMap[role] || "badge-neutral";
};

const getAvatarColor = (role: string) => {
  switch (role) {
    case "admin":
      return "bg-error text-error-content";
    case "teacher":
      return "bg-info text-info-content";
    default:
      return "bg-success text-success-content";
  }
};

const RoleIcon = ({ role }: { role: string }) => {
  switch (role) {
    case "admin":
      return <ShieldIcon />;
    case "teacher":
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
      admin: t.users.roleAdmin,
      teacher: t.users.roleTeacher,
      student: t.users.roleStudent,
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
                <th className="text-base-content font-bold">{t.users.role}</th>
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
                            <div
                              className={`${getAvatarColor(userItem.role)} w-full h-full flex items-center justify-center font-bold text-lg`}
                            >
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
                    <div
                      className={`badge gap-1 ${getRoleBadgeClass(userItem.role)}`}
                    >
                      <RoleIcon role={userItem.role} />
                      {getRoleTranslation(userItem.role)}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="text-base-content">
                        {new Date(userItem.createdAt).toLocaleDateString(
                          "th-TH",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                      <span className="text-xs text-base-content/50">
                        {new Date(userItem.createdAt).toLocaleTimeString(
                          "th-TH",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
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
