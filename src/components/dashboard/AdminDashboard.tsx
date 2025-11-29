'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/i18n/useLocale';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faUserClock, 
  faCheckCircle, 
  faExclamationTriangle,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  totalUsers: number;
  pendingRequests: number;
  activeStudents: number;
  totalCourses: number;
}

interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  user?: {
    name: string;
    role: string;
  };
}

export default function AdminDashboard() {
  const { t } = useLocale();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/activity')
        ]);

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
        
        if (activityRes.ok) {
          const data = await activityRes.json();
          setActivities(data.activities || []);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t.dashboard?.welcome} {user?.name || 'Admin'}</h1>
          <p className="text-base-content/70 mt-1">{t.dashboard?.overview}</p>
        </div>
        <div className="text-sm breadcrumbs">
          <ul>
            <li><Link href="/">{t.nav.home}</Link></li>
            <li>{t.nav.dashboard}</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stats shadow bg-base-100 border border-base-200">
          <div className="stat">
            <div className="stat-figure text-primary">
              <FontAwesomeIcon icon={faUsers} className="w-8 h-8" />
            </div>
            <div className="stat-title">{t.dashboard?.totalPersons}</div>
            <div className="stat-value text-primary">{stats?.totalUsers || 0}</div>
            <div className="stat-desc">{t.users?.allRegisteredUsers}</div>
          </div>
        </div>
        
        <div className="stats shadow bg-base-100 border border-base-200">
          <div className="stat">
            <div className="stat-figure text-warning">
              <FontAwesomeIcon icon={faUserClock} className="w-8 h-8" />
            </div>
            <div className="stat-title">{t.faceRequests?.pendingCount}</div>
            <div className="stat-value text-warning">{stats?.pendingRequests || 0}</div>
            <div className="stat-desc">{t.faceRequests?.pending}</div>
          </div>
        </div>

        <div className="stats shadow bg-base-100 border border-base-200">
          <div className="stat">
            <div className="stat-figure text-success">
              <FontAwesomeIcon icon={faCheckCircle} className="w-8 h-8" />
            </div>
            <div className="stat-title">{t.dashboard?.activeStudents}</div>
            <div className="stat-value text-success">{stats?.activeStudents || 0}</div>
            <div className="stat-desc">{t.dashboard?.verifiedProfiles}</div>
          </div>
        </div>

        <div className="stats shadow bg-base-100 border border-base-200">
          <div className="stat">
            <div className="stat-figure text-secondary">
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-8 h-8" />
            </div>
            <div className="stat-title">{t.dashboard?.statistics}</div>
            <div className="stat-value text-secondary">OK</div>
            <div className="stat-desc">{t.dashboard?.subtitle}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body">
            <h2 className="card-title flex justify-between">
              {t.dashboard?.recentActivity}
              <button className="btn btn-ghost btn-xs">{t.common?.view}</button>
            </h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>{t.users?.username}</th>
                    <th>{t.common?.actions}</th>
                    <th>{t.schedule?.time}</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.length > 0 ? (
                    activities.map((activity) => (
                      <tr key={activity.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="font-bold">{activity.user?.name || 'System'}</div>
                            <div className="text-xs opacity-50 badge badge-ghost badge-sm">{activity.user?.role}</div>
                          </div>
                        </td>
                        <td>
                          <span className="font-medium">
                            {activity.action === 'initial' ? t.faceRequests?.newImage : t.faceRequests?.title}
                          </span>
                          <br/>
                          <span className="text-xs opacity-70">
                            {t.faceRequests?.status}: {
                              activity.details.includes('pending') ? t.faceRequests?.pending :
                              activity.details.includes('approved') ? t.faceRequests?.approved :
                              activity.details.includes('rejected') ? t.faceRequests?.rejected :
                              activity.details
                            }
                          </span>
                        </td>
                        <td className="text-sm opacity-70">
                          {new Date(activity.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-base-content/50">
                        {t.common?.noData}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl border border-base-200 h-fit">
          <div className="card-body">
            <h2 className="card-title">{t.common?.actions}</h2>
            <div className="flex flex-col gap-3 mt-4">
              <Link href="/face-requests" className="btn btn-primary w-full justify-between">
                {t.faceRequests?.title}
                <div className="badge badge-warning">{stats?.pendingRequests || 0}</div>
              </Link>
              <Link href="/register" className="btn btn-outline w-full justify-between">
                {t.nav?.register}
                <FontAwesomeIcon icon={faArrowRight} />
              </Link>
              <Link href="/users" className="btn btn-outline w-full justify-between">
                {t.users?.title}
                <FontAwesomeIcon icon={faArrowRight} />
              </Link>
              <Link href="/settings" className="btn btn-ghost w-full justify-between">
                {t.settings?.title}
                <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
