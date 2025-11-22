'use client';

import { useLocale } from '@/hooks/useLocale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCheckCircle, faTimesCircle, faList } from '@fortawesome/free-solid-svg-icons';

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface FaceRequestStatsCardsProps {
  stats: Stats;
}

export default function FaceRequestStatsCards({ stats }: FaceRequestStatsCardsProps) {
  const { t } = useLocale();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="stats shadow">
        <div className="stat">
          <div className="stat-figure text-primary">
            <FontAwesomeIcon icon={faList} size="2x" />
          </div>
          <div className="stat-title">{t.faceRequests.totalRequests}</div>
          <div className="stat-value text-primary">{stats.total}</div>
        </div>
      </div>

      <div className="stats shadow">
        <div className="stat">
          <div className="stat-figure text-warning">
            <FontAwesomeIcon icon={faClock} size="2x" />
          </div>
          <div className="stat-title">{t.faceRequests.pendingCount}</div>
          <div className="stat-value text-warning">{stats.pending}</div>
        </div>
      </div>

      <div className="stats shadow">
        <div className="stat">
          <div className="stat-figure text-success">
            <FontAwesomeIcon icon={faCheckCircle} size="2x" />
          </div>
          <div className="stat-title">{t.faceRequests.approvedCount}</div>
          <div className="stat-value text-success">{stats.approved}</div>
        </div>
      </div>

      <div className="stats shadow">
        <div className="stat">
          <div className="stat-figure text-error">
            <FontAwesomeIcon icon={faTimesCircle} size="2x" />
          </div>
          <div className="stat-title">{t.faceRequests.rejectedCount}</div>
          <div className="stat-value text-error">{stats.rejected}</div>
        </div>
      </div>
    </div>
  );
}
