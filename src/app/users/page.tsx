'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';

// Components
import UserStatsCards from '@/components/users/UserStatsCards';
import UserFilterCard from '@/components/users/UserFilterCard';
import UserTable, { User } from '@/components/users/UserTable';
import UserFooterBadge from '@/components/users/UserFooterBadge';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import CreateUserModal from '@/components/users/CreateUserModal';
import EditUserModal from '@/components/users/EditUserModal';
import ImportResultModal from '@/components/students/ImportResultModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExcel, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

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

  // Import State
  const [importing, setImporting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [importResult, setImportResult] = useState<{ 
    success: boolean; 
    message: string; 
    errors?: string[]; 
    scannedCount?: number;
    successList?: { name: string; studentId: string }[];
  } | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Import Handlers
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    try {
      setImporting(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        showToast({ message: 'No data found in Excel file', type: 'error' });
        return;
      }

      showToast({ message: `Processing ${jsonData.length} records...`, type: 'info' });

      const response = await fetch('/api/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: jsonData }),
      });

      const result = await response.json();

      setImportResult({
          success: response.ok && result.success,
          message: result.message || (result.success ? 'Import successful' : 'Import failed'),
          errors: result.details?.errors || (result.error ? [result.error] : []),
          scannedCount: jsonData.length,
          successList: result.details?.successList || []
      });
      setIsResultModalOpen(true);

      if (response.ok && result.success) {
        fetchUsers(); // Refresh users list as importing students creates users
      }

    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
          success: false,
          message: error instanceof Error ? error.message : 'Failed to import',
          errors: [String(error)]
      });
      setIsResultModalOpen(true);
    } finally {
      setImporting(false);
    }
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="drawer drawer-end">
      <input id="help-drawer" type="checkbox" className="drawer-toggle" checked={showHelp} onChange={(e) => setShowHelp(e.target.checked)} />
      
      <div className="drawer-content min-h-screen bg-base-100 pb-10">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold">{t.users.title}</h1>
                    <p className="text-base-content/60">{t.users.subtitle}</p>
                </div>
                
                <div className="flex gap-2">
                    <button 
                        className="btn btn-outline btn-info btn-sm gap-2"
                        onClick={() => setShowHelp(true)}
                        title={t.students.importHelp.title}
                    >
                        <FontAwesomeIcon icon={faInfoCircle} className="w-4 h-4" />
                        {t.students.importHelp.instructionsBtn}
                    </button>
                    
                    <button 
                        className="btn btn-success text-white btn-sm gap-2 shadow-lg shadow-success/20 hover:shadow-success/40 transition-all"
                        onClick={handleImport}
                        disabled={importing}
                    >
                        {importing ? <span className="loading loading-spinner loading-xs"></span> : <FontAwesomeIcon icon={faFileExcel} />}
                        {t.students.importExcel}
                    </button>
                </div>
                <input 
                    type="file" 
                    hidden 
                    ref={fileInputRef} 
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                />
            </div>

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

            {/* Import Modals */}
            <ImportResultModal 
                isOpen={isResultModalOpen} 
                onClose={() => setIsResultModalOpen(false)} 
                result={importResult} 
            />
        </div>
      </div>

      <div className="drawer-side z-50">
        <label htmlFor="help-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        <div className="menu p-0 w-80 md:w-96 min-h-full bg-base-100 text-base-content shadow-2xl">
          {/* Header */}
          <div className="bg-base-200/50 p-6 border-b border-base-200 flex justify-between items-center sticky top-0 backdrop-blur-md z-10">
            <h3 className="font-bold text-xl flex items-center gap-3 text-primary">
              <FontAwesomeIcon icon={faInfoCircle} className="w-5 h-5" />
              {t.students.importHelp.title}
            </h3>
            <button 
              onClick={() => setShowHelp(false)} 
              className="btn btn-circle btn-ghost btn-sm"
            >
              ✕
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto pb-20">
             <div className="prose prose-sm max-w-none">
              <p className="text-base-content/80">
                {t.students.importHelp.description}
              </p>
            </div>

            <div className="space-y-4">
               {[
                  { key: 'studentId', required: true, desc: t.students.importHelp.fields.studentId },
                  { key: 'name', required: true, desc: t.students.importHelp.fields.name },
                  { key: 'email', required: true, desc: t.students.importHelp.fields.email },
                ].map((field) => (
                  <div key={field.key} className="card bg-base-100 border border-base-200 shadow-sm col-span-1">
                    <div className="card-body p-4 gap-2">
                       <div className="flex justify-between items-start">
                          <code className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded text-sm">{field.key}</code>
                          {field.required ? (
                             <span className="badge badge-error badge-xs text-white">{t.students.importHelp.required}</span>
                          ) : (
                             <span className="badge badge-ghost badge-xs">{t.students.importHelp.optional}</span>
                          )}
                       </div>
                       <p className="text-sm text-base-content/70">{field.desc}</p>
                    </div>
                  </div>
                ))}
            </div>

            <div className="alert bg-info/5 border-info/20 text-info-content shadow-sm rounded-xl">
              <div className="flex flex-col gap-2">
                 <div className="flex items-center gap-2 font-bold text-info">
                    <FontAwesomeIcon icon={faInfoCircle} />
                    <span>{t.students.importHelp.note}</span>
                 </div>
                 <p className="text-sm opacity-90">{t.students.importHelp.noteText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
