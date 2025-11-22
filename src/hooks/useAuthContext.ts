'use client';

import { useAuth } from '@/contexts/AuthContext';

export function useAuthContext() {
  return useAuth();
}
