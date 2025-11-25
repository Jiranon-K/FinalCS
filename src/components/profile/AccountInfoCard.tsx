'use client';

import { useLocale } from '@/hooks/useLocale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCalendarAlt, faClock } from '@fortawesome/free-solid-svg-icons';

interface AccountInfoCardProps {
  username: string;
  createdAt?: string;
  lastLogin?: string;
}

export default function AccountInfoCard({ username, createdAt, lastLogin }: AccountInfoCardProps) {
  const { t } = useLocale();

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="card bg-base-100 shadow-xl border border-base-200">
      <div className="card-body p-6">
        <h3 className="font-bold text-lg mb-4 border-b pb-2">{t.profile.accountInfo}</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center text-primary">
              <FontAwesomeIcon icon={faUser} />
            </div>
            <div>
              <div className="text-xs text-base-content/60">{t.users.username}</div>
              <div className="text-sm font-medium">{username}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center text-primary">
              <FontAwesomeIcon icon={faCalendarAlt} />
            </div>
            <div>
              <div className="text-xs text-base-content/60">{t.profile.accountCreated}</div>
              <div className="text-sm">{formatDate(createdAt)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center text-primary">
              <FontAwesomeIcon icon={faClock} />
            </div>
            <div>
              <div className="text-xs text-base-content/60">{t.profile.lastLogin}</div>
              <div className="text-sm">{formatDateTime(lastLogin)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
