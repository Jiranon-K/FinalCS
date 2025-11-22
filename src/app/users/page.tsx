'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';

import UserStatsCards from '@/components/users/UserStatsCards';
import UserFilterCard from '@/components/users/UserFilterCard';
import UserTable from '@/components/users/UserTable';
import { User } from '@/types/user';
import UserFooterBadge from '@/components/users/UserFooterBadge';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import CreateUserModal from '@/components/users/CreateUserModal';
import EditUserModal from '@/components/users/EditUserModal';


export default function UsersPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/');
      showToast({ message: t.users.accessDenied, type: 'error' });
    }
  }, [user, router, showToast, t]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);

      const response = await fetch(`/api/users?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setUsers(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast({
        message: error instanceof Error ? error.message : t.users.deleteError,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, showToast, t.users.deleteError]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user, fetchUsers]);

  const handleDelete = (userId: string) => {
    const user = users.find(u => u._id === userId);
    if (user) {
      setUserToDelete(user);
      setDeleteModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/users/${userToDelete._id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        showToast({ message: t.users.deleteSuccess, type: 'success' });
        fetchUsers();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast({
        message: error instanceof Error ? error.message : t.users.deleteError,
        type: 'error'
      });
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleView = () => {
    showToast({ message: t.users.editFeatureComingSoon, type: 'info' });
  };

  const handleEdit = (user: User) => {
    setUserToEdit(user);
    setEditModalOpen(true);
  };

  const handleClearFilters = () => {
    setSearch('');
    setRoleFilter('');
  };

  const stats = useMemo(() => {
    const adminCount = users.filter(u => u.role === 'admin').length;
    const teacherCount = users.filter(u => u.role === 'teacher').length;
    const studentCount = users.filter(u => u.role === 'student').length;
    return { adminCount, teacherCount, studentCount, total: users.length };
  }, [users]);


  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-base-100 pb-10">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold">{t.users.title}</h1>
            <p className="text-base-content/60">{t.users.subtitle}</p>
          </div>
        </div>

        <UserStatsCards stats={stats} />

        <UserFilterCard
          search={search}
          roleFilter={roleFilter}
          onSearchChange={setSearch}
          onRoleFilterChange={setRoleFilter}
          onCreateUser={() => setCreateModalOpen(true)}
        />

        <UserTable
          users={users}
          loading={loading}
          hasFilters={!!(search || roleFilter)}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onClearFilters={handleClearFilters}
        />

        <UserFooterBadge totalUsers={users.length} loading={loading} />

        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          title={t.users.confirmDelete}
          message={`${t.users.confirmDelete} "${userToDelete?.fullName || userToDelete?.username || ''}"?`}
          confirmLabel={t.users.delete}
          cancelLabel={t.users.cancel}
          loading={deleting}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />

        <CreateUserModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={fetchUsers}
        />

        <EditUserModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setUserToEdit(null);
          }}
          onSuccess={fetchUsers}
          user={userToEdit}
        />

      </div>
    </div>
  );
}
