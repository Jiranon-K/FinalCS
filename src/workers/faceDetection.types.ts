import type { FaceDescriptor } from '@/types/face';

export type WorkerMessageType = 
  | 'INIT'
  | 'INIT_COMPLETE'
  | 'INIT_ERROR'
  | 'DETECT'
  | 'DETECTION_RESULT'
  | 'RECOGNIZE'
  | 'RECOGNITION_RESULT';

export interface WorkerInitPayload {
  modelPath: string;
  settings: {
    detectorModel: 'ssd_mobilenetv1' | 'tiny_face_detector';
    detectionThreshold: number;
    enableExpressions: boolean;
    enableAgeGender: boolean;
  };
}

export interface WorkerDetectPayload {
  imageData: ImageData;
  frameId: number;
}

export interface WorkerRecognizePayload {
  descriptor: number[];
  knownPersons: Array<{
    id: string;
    name: string;
    faceDescriptor: number[];
  }>;
  recognitionThreshold: number;
}

export interface DetectionResultPayload {
  frameId: number;
  faces: Array<{
    detection: {
      box: { x: number; y: number; width: number; height: number };
      score: number;
    };
    landmarks?: {
      positions: Array<{ x: number; y: number }>;
    };
    descriptor?: number[];
  }>;
}

export interface RecognitionResultPayload {
  personId: string | null;
  personName: string | null;
  distance: number;
  confidence: number;
}

export interface WorkerMessage<T = unknown> {
  type: WorkerMessageType;
  payload: T;
}
