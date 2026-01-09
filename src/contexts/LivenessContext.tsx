'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useLocale } from '@/i18n/LocaleContext';
import { BlinkDetector, HeadPoseDetector, getRandomChallenges } from '@/utils/livenessDetection';
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

    const challenges = getRandomChallenges(3);

    setState({
      ...initialState,
      isActive: true,
      currentChallenge: challenges[0],
      challenges: challenges,
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
  }, [settings]);

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
      if (!blinkDetectorRef.current) return;

      const result = blinkDetectorRef.current.detect(landmarks);
      
      if (result.isBlinking || Math.random() < 0.1) {
          console.log('Liveness Process:', { 
              isBlinking: result.isBlinking, 
              ear: result.ear, 
          });
      }

      setState((prev) => {
        if (!prev.isActive || !prev.currentChallenge) return prev;

        let isActionCompleted = false;


        if (prev.currentChallenge.action === 'BLINK') {

             if (result.totalBlinks >= settings.requiredBlinks) {
                isActionCompleted = true;
             }
        }

        else if (prev.currentChallenge.action === 'TURN_LEFT' || prev.currentChallenge.action === 'TURN_RIGHT') {
            const headResult = HeadPoseDetector.detect(landmarks);
            if (headResult.action === prev.currentChallenge.action) {
                isActionCompleted = true;
            }
        }

        const newState = {
          ...prev,
          blinkCount: result.totalBlinks,
          lastEAR: result.ear,
          isBlinking: result.isBlinking,
        };

        if (isActionCompleted && prev.currentChallenge) {
          console.log(`Challenge ${prev.currentChallenge.action} Completed!`);
          
          const nextIndex = prev.currentChallengeIndex + 1;
          const isFinished = nextIndex >= prev.challenges.length;

          const updatedCurrentChallenge = {
             ...prev.currentChallenge,
             completed: true,
             completedTime: Date.now(),
          };
          
          const updatedChallenges = [...prev.challenges];
          updatedChallenges[prev.currentChallengeIndex] = updatedCurrentChallenge;

          if (isFinished) {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
              return {
                ...newState,
                challenges: updatedChallenges,
                currentChallenge: updatedCurrentChallenge,
                isVerified: true,
                isActive: false,
              };
          } else {

             
             return {
                 ...newState,
                 challenges: updatedChallenges,
                 currentChallenge: prev.challenges[nextIndex],
                 currentChallengeIndex: nextIndex,
             };
          }
        }

        return newState;
      });
    },
    [settings.requiredBlinks]
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