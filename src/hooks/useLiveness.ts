import { useLivenessContext } from '@/contexts/LivenessContext';

export function useLiveness() {
  return useLivenessContext();
}