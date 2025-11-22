'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faExclamationCircle,
  faExclamationTriangle,
  faInfoCircle,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import type { Toast as ToastType } from '@/types/toast';

interface ToastProps {
  toast: ToastType;
  onClose: (id: string) => void;
}

const toastConfig = {
  success: {
    alertClass: 'alert-success',
    icon: faCheckCircle,
  },
  error: {
    alertClass: 'alert-error',
    icon: faExclamationCircle,
  },
  warning: {
    alertClass: 'alert-warning',
    icon: faExclamationTriangle,
  },
  info: {
    alertClass: 'alert-info',
    icon: faInfoCircle,
  },
};

export function Toast({ toast, onClose }: ToastProps) {
  const config = toastConfig[toast.type];

  return (
    <div className={`alert ${config.alertClass} shadow-lg`}>
      <FontAwesomeIcon icon={config.icon} className="w-5 h-5" />
      <span>{toast.message}</span>
      <button
        onClick={() => onClose(toast.id)}
        className="btn btn-ghost btn-sm btn-circle"
        aria-label="Close"
      >
        <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
      </button>
    </div>
  );
}
