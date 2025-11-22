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
  gender: "male" | "female";
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
  detectorModel: "ssd_mobilenetv1" | "tiny_face_detector" | "mediapipe";
  enableLandmarks: boolean;
  enableExpressions: boolean;
  enableAgeGender: boolean;
}

export const DEFAULT_FACE_SETTINGS: FaceRecognitionSettings = {
  detectionThreshold: 0.5,
  recognitionThreshold: 0.3,
  detectorModel: "ssd_mobilenetv1",
  enableLandmarks: true,
  enableExpressions: false,
  enableAgeGender: false,
};

export interface FaceApiDetection {
  detection: {
    box: { x: number; y: number; width: number; height: number };
    score: number;
  };
  landmarks?: {
    positions: { x: number; y: number }[];
    shift: { x: number; y: number };
  };
  descriptor?: Float32Array;
  expressions?: {
    neutral: number;
    happy: number;
    sad: number;
    angry: number;
    fearful: number;
    disgusted: number;
    surprised: number;
  };
  age?: number;
  gender?: "male" | "female";
  genderProbability?: number;
}

export interface FaceAPIContextType {
  modelsLoaded: boolean;
  isLoading: boolean;
  settings: FaceRecognitionSettings;
  error: string | null;
  loadModels: () => Promise<void>;
  detectFaces: (
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  ) => Promise<FaceDetectionResult[]>;
  extractDescriptor: (
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  ) => Promise<FaceDescriptor | null>;
  recognizeFace: (
    descriptor: FaceDescriptor,
    knownPersons: import("./person").PersonForRecognition[],
  ) => FaceMatch | null;
  updateSettings: (newSettings: Partial<FaceRecognitionSettings>) => void;
}
