'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';

// Components
import UserStatsCards from '@/components/users/UserStatsCards';
import UserFilterCard from '@/components/users/UserFilterCard';
import UserTable, { User } from '@/components/users/UserTable';
import UserFooterBadge from '@/components/users/UserFooterBadge';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import CreateUserModal from '@/components/users/CreateUserModal';
import EditUserModal from '@/components/users/EditUserModal';

export default function UsersPage() {
  const { t } = useLocale();
  const { showToast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
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
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats Cards */}
        <UserStatsCards stats={stats} />

        {/* Filter Card */}
        <UserFilterCard
          search={search}
          roleFilter={roleFilter}
          onSearchChange={setSearch}
          onRoleFilterChange={setRoleFilter}
          onCreateUser={() => setCreateModalOpen(true)}
        />

        {/* Users Table */}
        <UserTable
          users={users}
          loading={loading}
          hasFilters={!!(search || roleFilter)}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onClearFilters={handleClearFilters}
        />

        {/* Footer Badge */}
        <UserFooterBadge totalUsers={users.length} loading={loading} />

        {/* Delete Confirmation Modal */}
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

        {/* Create User Modal */}
        <CreateUserModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={fetchUsers}
        />

        {/* Edit User Modal */}
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
