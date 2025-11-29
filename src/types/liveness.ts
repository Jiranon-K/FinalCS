export interface Point {
  x: number;
  y: number;
}

export const EYE_LANDMARKS = {
  LEFT_EYE: [36, 37, 38, 39, 40, 41],
  RIGHT_EYE: [42, 43, 44, 45, 46, 47],
} as const;

export type LivenessAction = 'BLINK' | 'TURN_LEFT' | 'TURN_RIGHT' | 'SMILE' | 'NOD';

export interface LivenessChallenge {
  action: LivenessAction;
  instruction: string;
  completed: boolean;
  startTime?: number;
  completedTime?: number;
}

export interface LivenessState {
  isActive: boolean;
  currentChallenge: LivenessChallenge | null;
  challenges: LivenessChallenge[];
  currentChallengeIndex: number;
  isVerified: boolean;
  failedAttempts: number;
  blinkCount: number;
  lastEAR: number;
  isBlinking: boolean;
}

export interface LivenessSettings {
  earThreshold: number;
  consecutiveFrames: number;
  challengeTimeout: number;
  maxFailedAttempts: number;
  requiredBlinks: number;
}

export const DEFAULT_LIVENESS_SETTINGS: LivenessSettings = {
  earThreshold: 0.21,
  consecutiveFrames: 2,
  challengeTimeout: 5,
  maxFailedAttempts: 3,
  requiredBlinks: 2,
};