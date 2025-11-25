'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/hooks/useLocale';
import { useRouter } from 'next/navigation';
import FaceRequestsTable from '@/components/face-requests/FaceRequestsTable';
import FaceRequestStatsCards from '@/components/face-requests/FaceRequestStatsCards';

export default function FaceRequestsPage() {
  const { user, isLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoadingRequests(true);
      const res = await fetch(`/api/face-update-requests?status=${filterStatus === 'all' ? '' : filterStatus}`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchRequests();
    }
  }, [user, fetchRequests]);

  const stats = {
    total: requests.length, 
    pending: requests.filter((r: any) => r.status === 'pending').length,
    approved: requests.filter((r: any) => r.status === 'approved').length,
    rejected: requests.filter((r: any) => r.status === 'rejected').length,
  };

  const [allRequests, setAllRequests] = useState([]);

  const fetchAllRequests = useCallback(async () => {
    try {
      setIsLoadingRequests(true);
      const res = await fetch('/api/face-update-requests');
      const data = await res.json();
      if (data.success) {
        setAllRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAllRequests();
    }
  }, [user, fetchAllRequests]);

  const filteredRequests = filterStatus === 'all' 
    ? allRequests 
    : allRequests.filter((r: any) => r.status === filterStatus);

  const realStats = {
    total: allRequests.length,
    pending: allRequests.filter((r: any) => r.status === 'pending').length,
    approved: allRequests.filter((r: any) => r.status === 'approved').length,
    rejected: allRequests.filter((r: any) => r.status === 'rejected').length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-base-100 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-base-content">{t.faceRequests.title}</h1>
            <p className="text-base-content/60 mt-2">{t.faceRequests.subtitle}</p>
          </div>
          
          <div className="join">
            <button 
              className={`join-item btn btn-sm ${filterStatus === 'pending' ? 'btn-active btn-primary' : ''}`}
              onClick={() => setFilterStatus('pending')}
            >
              {t.faceRequests.pending}
            </button>
            <button 
              className={`join-item btn btn-sm ${filterStatus === 'approved' ? 'btn-active btn-primary' : ''}`}
              onClick={() => setFilterStatus('approved')}
            >
              {t.faceRequests.approved}
            </button>
            <button 
              className={`join-item btn btn-sm ${filterStatus === 'rejected' ? 'btn-active btn-primary' : ''}`}
              onClick={() => setFilterStatus('rejected')}
            >
              {t.faceRequests.rejected}
            </button>
            <button 
              className={`join-item btn btn-sm ${filterStatus === 'all' ? 'btn-active btn-primary' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              {t.faceRequests.all}
            </button>
          </div>
        </div>

        <FaceRequestStatsCards stats={realStats} />

        {isLoadingRequests ? (
          <div className="flex justify-center p-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <FaceRequestsTable 
            requests={filteredRequests} 
            onRefresh={fetchAllRequests} 
          />
        )}
      </div>
    </div>
  );
}
