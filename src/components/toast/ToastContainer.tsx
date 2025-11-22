'use client';

import { useToast } from '@/hooks/useToast';
import { Toast } from './Toast';

export function ToastContainer() {
  const { toasts, hideToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast toast-top toast-center z-50">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={hideToast} />
      ))}
    </div>
  );
}
