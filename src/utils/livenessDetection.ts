import type { Point } from '@/types/liveness';
import { EYE_LANDMARKS } from '@/types/liveness';

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