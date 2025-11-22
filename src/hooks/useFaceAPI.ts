import { useContext } from 'react';
import { FaceAPIContext } from '@/contexts/FaceAPIContext';

export function useFaceAPI() {
  const context = useContext(FaceAPIContext);
  if (context === undefined) {
    throw new Error('useFaceAPI must be used within a FaceAPIProvider');
  }
  return context;
}
