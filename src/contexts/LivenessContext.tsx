'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useLocale } from '@/i18n/LocaleContext';
import { BlinkDetector } from '@/utils/livenessDetection';
import type {
  LivenessState,
  LivenessSettings,
  LivenessChallenge,
} from '@/types/liveness';
import { DEFAULT_LIVENESS_SETTINGS } from '@/types/liveness';

interface LivenessContextType {
  state: LivenessState;
  settings: LivenessSettings;
  startVerification: () => void;
  stopVerification: () => void;
  processFrame: (landmarks: Array<{ x: number; y: number }>) => void;
  resetVerification: () => void;
  updateSettings: (newSettings: Partial<LivenessSettings>) => void;
}

const LivenessContext = createContext<LivenessContextType | undefined>(undefined);

const initialState: LivenessState = {
  isActive: false,
  currentChallenge: null,
  challenges: [],
  currentChallengeIndex: 0,
  isVerified: false,
  failedAttempts: 0,
  blinkCount: 0,
  lastEAR: 0.3,
  isBlinking: false,
};

export function LivenessProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const [state, setState] = useState<LivenessState>(initialState);
  const [settings, setSettings] = useState<LivenessSettings>({
    ...DEFAULT_LIVENESS_SETTINGS,
    requiredBlinks: 2,
    challengeTimeout: 10,
    consecutiveFrames: 1,
    earThreshold: 0.25,
  });
  
  const blinkDetectorRef = useRef<BlinkDetector | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startVerification = useCallback(() => {
    blinkDetectorRef.current = new BlinkDetector(
      settings.earThreshold,
      settings.consecutiveFrames
    );

    const blinkChallenge: LivenessChallenge = {
      action: 'BLINK',
      instruction: (t.liveness?.blinkInstruction || 'Please blink {count} times').replace('{count}', settings.requiredBlinks.toString()),
      completed: false,
      startTime: Date.now(),
    };

    setState({
      ...initialState,
      isActive: true,
      currentChallenge: blinkChallenge,
      challenges: [blinkChallenge],
      currentChallengeIndex: 0,
    });

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        failedAttempts: prev.failedAttempts + 1,
        isActive: prev.failedAttempts + 1 < settings.maxFailedAttempts,
      }));
    }, settings.challengeTimeout * 1000);
  }, [settings, t]);

  const stopVerification = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    blinkDetectorRef.current?.reset();
    setState((prev) => ({ ...prev, isActive: false }));
  }, []);

  const resetVerification = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    blinkDetectorRef.current?.reset();
    setState(initialState);
  }, []);

  const processFrame = useCallback(
    (landmarks: Array<{ x: number; y: number }>) => {
      if (!state.isActive || !blinkDetectorRef.current) return;

      const result = blinkDetectorRef.current.detect(landmarks);
      
      if (result.isBlinking || Math.random() < 0.1) {
          console.log('Liveness Process:', { 
              isActive: state.isActive,
              isBlinking: result.isBlinking, 
              ear: result.ear, 
              totalBlinks: result.totalBlinks, 
              required: settings.requiredBlinks 
          });
      }

      setState((prev) => {
        const newState = {
          ...prev,
          blinkCount: result.totalBlinks,
          lastEAR: result.ear,
          isBlinking: result.isBlinking,
        };

        if (result.totalBlinks >= settings.requiredBlinks && prev.currentChallenge) {
          console.log('Liveness Challenge Completed!');
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          return {
            ...newState,
            isVerified: true,
            isActive: false,
            currentChallenge: {
              ...prev.currentChallenge,
              completed: true,
              completedTime: Date.now(),
            },
          };
        }

        return newState;
      });
    },
    [state.isActive, settings.requiredBlinks]
  );

  const updateSettings = useCallback((newSettings: Partial<LivenessSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const value: LivenessContextType = {
    state,
    settings,
    startVerification,
    stopVerification,
    processFrame,
    resetVerification,
    updateSettings,
  };

  return (
    <LivenessContext.Provider value={value}>
      {children}
    </LivenessContext.Provider>
  );
}

export function useLivenessContext() {
  const context = useContext(LivenessContext);
  if (context === undefined) {
    throw new Error('useLivenessContext must be used within a LivenessProvider');
  }
  return context;
}