import type { Point, LivenessAction, LivenessChallenge } from '@/types/liveness';
import { EYE_LANDMARKS } from '@/types/liveness';


const HEAD_POSE_LANDMARKS = {
  NOSE_TIP: 30,
  LEFT_EYE_OUTER: 36,
  RIGHT_EYE_OUTER: 45,
};

export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function calculateEAR(eyePoints: Point[]): number {
  if (eyePoints.length !== 6) {
    console.warn('EAR calculation requires exactly 6 eye points');
    return 0.3;
  }

  const vertical1 = distance(eyePoints[1], eyePoints[5]);
  const vertical2 = distance(eyePoints[2], eyePoints[4]);
  const horizontal = distance(eyePoints[0], eyePoints[3]);

  if (horizontal === 0) return 0.3;

  const ear = (vertical1 + vertical2) / (2.0 * horizontal);
  return ear;
}

export function extractEyeLandmarks(
  landmarks: Array<{ x: number; y: number }>
): { leftEye: Point[]; rightEye: Point[] } {
  const leftEye = EYE_LANDMARKS.LEFT_EYE.map((idx) => landmarks[idx]);
  const rightEye = EYE_LANDMARKS.RIGHT_EYE.map((idx) => landmarks[idx]);

  return { leftEye, rightEye };
}

export function calculateAverageEAR(
  landmarks: Array<{ x: number; y: number }>
): number {
  const { leftEye, rightEye } = extractEyeLandmarks(landmarks);
  
  const leftEAR = calculateEAR(leftEye);
  const rightEAR = calculateEAR(rightEye);
  
  return (leftEAR + rightEAR) / 2.0;
}

export function isBlinking(
  landmarks: Array<{ x: number; y: number }>,
  threshold: number = 0.21
): boolean {
  const avgEAR = calculateAverageEAR(landmarks);
  return avgEAR < threshold;
}

export class BlinkDetector {
  private earThreshold: number;
  private consecutiveFrames: number;
  private blinkCounter: number = 0;
  private frameCounter: number = 0;
  private wasBlinking: boolean = false;

  constructor(earThreshold: number = 0.21, consecutiveFrames: number = 2) {
    this.earThreshold = earThreshold;
    this.consecutiveFrames = consecutiveFrames;
  }

  detect(landmarks: Array<{ x: number; y: number }>): {
    isBlinking: boolean;
    blinkDetected: boolean;
    ear: number;
    totalBlinks: number;
  } {
    const ear = calculateAverageEAR(landmarks);
    const currentlyBlinking = ear < this.earThreshold;
    let blinkDetected = false;

    if (currentlyBlinking) {
      this.frameCounter++;
    } else {
      if (this.frameCounter >= this.consecutiveFrames && this.wasBlinking) {
        this.blinkCounter++;
        blinkDetected = true;
      }
      this.frameCounter = 0;
    }

    this.wasBlinking = currentlyBlinking;

    return {
      isBlinking: currentlyBlinking,
      blinkDetected,
      ear,
      totalBlinks: this.blinkCounter,
    };
  }

  reset(): void {
    this.blinkCounter = 0;
    this.frameCounter = 0;
    this.wasBlinking = false;
  }

  getBlinkCount(): number {
    return this.blinkCounter;
  }
}

export class HeadPoseDetector {

  private static readonly TURN_LEFT_THRESHOLD = 0.35;
  private static readonly TURN_RIGHT_THRESHOLD = 0.65;

  static detect(landmarks: Array<{ x: number; y: number }>): {
    action: LivenessAction | null;
    rating: number; // 0 (left) to 1 (right), 0.5 is center
  } {
    const nose = landmarks[HEAD_POSE_LANDMARKS.NOSE_TIP];
    const leftEye = landmarks[HEAD_POSE_LANDMARKS.LEFT_EYE_OUTER];
    const rightEye = landmarks[HEAD_POSE_LANDMARKS.RIGHT_EYE_OUTER];

    if (!nose || !leftEye || !rightEye) {
      return { action: null, rating: 0.5 };
    }

    const distToLeftType = distance(leftEye, nose);
    const distToRightEye = distance(rightEye, nose);
    const totalDist = distToLeftType + distToRightEye;

    if (totalDist === 0) return { action: null, rating: 0.5 };


    
    const ratio = distToLeftType / totalDist;

    let action: LivenessAction | null = null;

    if (ratio < this.TURN_LEFT_THRESHOLD) {
      action = 'TURN_LEFT';
    } else if (ratio > this.TURN_RIGHT_THRESHOLD) {
      action = 'TURN_RIGHT';
    }

    return { action, rating: ratio };
  }
}

export function getRandomChallenges(count: number = 3): LivenessChallenge[] {
  const actions: LivenessAction[] = ['BLINK', 'TURN_LEFT', 'TURN_RIGHT'];
  const challenges: LivenessChallenge[] = [];

  for (let i = 0; i < count; i++) {
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    let instruction = '';

    switch (randomAction) {
      case 'BLINK':
        instruction = 'Blink your eyes';
        break;
      case 'TURN_LEFT':
        instruction = 'Turn head Left';
        break;
      case 'TURN_RIGHT':
        instruction = 'Turn head Right';
        break;
      case 'SMILE':
        instruction = 'Smile';
        break;
    }

    challenges.push({
      action: randomAction,
      instruction,
      completed: false,
      startTime: Date.now(),
    });
  }
  

  if (!challenges.some(c => c.action === 'BLINK')) {
      challenges[0] = {
          action: 'BLINK',
          instruction: 'Blink your eyes',
          completed: false,
          startTime: Date.now()
      };
  }

  return challenges;
}