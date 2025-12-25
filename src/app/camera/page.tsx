'use client';

import { useState, useEffect, useCallback } from 'react';
import CameraView from "@/components/camera/CameraView";
import CameraSidebar from "@/components/camera/CameraSidebar";
import type { AttendanceSession } from '@/types/session';
import type { AttendanceRecord } from '@/types/attendance';

export default function CameraPage() {
  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const fetchActiveSessions = async () => {
    try {
      const response = await fetch('/api/attendance/sessions/active');
      const data = await response.json();
      if (data.success) {
        setActiveSessions(data.data);
      }
    } catch (err) {
      console.error('Error fetching active sessions:', err);
    }
  };

  const fetchRecentRecords = useCallback(async () => {
    try {
      setLoadingRecords(true);
      const response = await fetch('/api/attendance/records?limit=10&skip=0&status=present', { cache: 'no-store' });
      const data = await response.json();
      if (data.success) {
        setRecentRecords(data.data);
      }
    } catch (err) {
      console.error('Error fetching recent records:', err);
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveSessions();
    fetchRecentRecords();
    const interval = setInterval(fetchActiveSessions, 10000); 

    return () => clearInterval(interval);
  }, [fetchRecentRecords]);

  return (
    <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-[1600px] h-auto min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-full">
        {/* Main Camera Area */}
        <div className="lg:col-span-8 h-auto lg:h-full flex flex-col min-h-0">
          <CameraView 
            activeSessions={activeSessions} 
            onAttendanceRecorded={() => {
              fetchRecentRecords();
              fetchActiveSessions();
            }} 
          />
        </div>

        {/* Sidebar Area */}
        <div className="lg:col-span-4 h-auto lg:h-full min-h-0 overflow-visible lg:overflow-hidden">
          <CameraSidebar 
            activeSessions={activeSessions} 
            recentRecords={recentRecords} 
            loadingRecords={loadingRecords} 
          />
        </div>
      </div>
    </div>
  );
}
