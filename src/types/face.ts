export interface FaceDetection {
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  score: number;
}

export interface FaceLandmarks {
  positions: Array<{ x: number; y: number }>;
  shift: { x: number; y: number };
}

export interface FaceExpressions {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}

export interface AgeGenderPrediction {
  age: number;
  gender: 'male' | 'female';
  genderProbability: number;
}

export type FaceDescriptor = Float32Array | number[];

export interface FaceDetectionResult {
  detection: FaceDetection;
  landmarks?: FaceLandmarks;
  expressions?: FaceExpressions;
  ageGender?: AgeGenderPrediction;
  descriptor?: FaceDescriptor;
}

export interface FaceMatch {
  personId: string;
  personName: string;
  distance: number;
  confidence: number;
}

export interface FaceRecognitionSettings {
  detectionThreshold: number;
  recognitionThreshold: number;
  detectorModel: 'ssd_mobilenetv1' | 'tiny_face_detector';
  enableLandmarks: boolean;
  enableExpressions: boolean;
  enableAgeGender: boolean;
}

export const DEFAULT_FACE_SETTINGS: FaceRecognitionSettings = {
  detectionThreshold: 0.5,
  recognitionThreshold: 0.6,
  detectorModel: 'ssd_mobilenetv1',
  enableLandmarks: true,
  enableExpressions: false,
  enableAgeGender: false,
};
