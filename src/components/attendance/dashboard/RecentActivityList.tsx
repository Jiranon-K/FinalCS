import { useLocale } from '@/hooks/useLocale';

interface RecentSession {
  id: string;
  courseName: string;
  date: string;
  presentCount: number;
  totalCount: number;
  status: string;
}

interface RecentActivityListProps {
  sessions: RecentSession[];
}

export default function RecentActivityList({ sessions }: RecentActivityListProps) {
  const { t } = useLocale();

  if (!sessions || sessions.length === 0) {
    return null;
  }

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200 h-full">
      <div className="card-body p-4">
        <h3 className="card-title text-lg mb-4">{t.attendanceManagement.recentActivity || 'Recent Activity'}</h3>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 bg-base-200/50 rounded-lg">
              <div>
                <div className="font-medium">{session.courseName}</div>
                <div className="text-xs text-base-content/60">
                  {new Date(session.date).toLocaleDateString()} • {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  <span className="text-success">{session.presentCount}</span>
                  <span className="text-base-content/40">/</span>
                  <span>{session.totalCount}</span>
                </div>
                <div className="text-xs text-base-content/60">{t.attendanceManagement.present || 'Present'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
