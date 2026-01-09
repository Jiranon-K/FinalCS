/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import type {
  FaceDetectionResult,
  FaceRecognitionSettings,
  FaceMatch,
  FaceDescriptor,
} from '@/types/face';
import type { PersonForRecognition } from '@/types/person';


type FaceAPIModule = any;

type TFModule = any;

interface FaceApiDetection {
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
  gender?: 'male' | 'female';
  genderProbability?: number;
}

interface FaceAPIContextType {
  modelsLoaded: boolean;
  isLoading: boolean;
  settings: FaceRecognitionSettings;
  error: string | null;
  loadModels: () => Promise<void>;
  detectFaces: (
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ) => Promise<FaceDetectionResult[]>;
  extractDescriptor: (
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ) => Promise<FaceDescriptor | null>;
  recognizeFace: (
    descriptor: FaceDescriptor,
    knownPersons: PersonForRecognition[]
  ) => FaceMatch | null;
  updateSettings: (newSettings: Partial<FaceRecognitionSettings>) => void;
}

export const FaceAPIContext = createContext<FaceAPIContextType | undefined>(undefined);

const DEFAULT_SETTINGS: FaceRecognitionSettings = {
  detectionThreshold: 0.5,
  recognitionThreshold: 0.5,
  detectorModel: 'ssd_mobilenetv1',
  enableLandmarks: false,
  enableExpressions: false,
  enableAgeGender: false,
};

export function FaceAPIProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<FaceRecognitionSettings>(DEFAULT_SETTINGS);
  const [error, setError] = useState<string | null>(null);

  const faceapiRef = useRef<FaceAPIModule | null>(null);
  const tfRef = useRef<TFModule | null>(null);

  const loadModels = useCallback(async () => {
    if (modelsLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      const [tf, faceapi] = await Promise.all([
        import('@tensorflow/tfjs'),
        import('@vladmandic/face-api')
      ]);

      tfRef.current = tf;
      faceapiRef.current = faceapi;

      try {
        await tf.setBackend('webgl');
      } catch (e) {
        console.warn('Failed to set WebGL backend, falling back to default:', e);
      }
      await tf.ready();
      const modelPath = '/model';

      await Promise.all([
        settings.detectorModel === 'ssd_mobilenetv1'
          ? faceapi.nets.ssdMobilenetv1.loadFromUri(modelPath)
          : faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),

        faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),

        faceapi.nets.faceRecognitionNet.loadFromUri(modelPath),

        settings.enableAgeGender
          ? faceapi.nets.ageGenderNet.loadFromUri(modelPath)
          : Promise.resolve(),

        settings.enableExpressions
          ? faceapi.nets.faceExpressionNet.loadFromUri(modelPath)
          : Promise.resolve(),
      ]);

      setModelsLoaded(true);
      console.log('✅ Face-api.js models loaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load models';
      setError(errorMessage);
      console.error('❌ Error loading face-api.js models:', err);
    } finally {
      setIsLoading(false);
    }
  }, [modelsLoaded, settings.detectorModel, settings.enableAgeGender, settings.enableExpressions]);

  const detectFaces = useCallback(
    async (
      input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
    ): Promise<FaceDetectionResult[]> => {
      const faceapi = faceapiRef.current;

      if (!modelsLoaded || !faceapi) {
        throw new Error('Models not loaded. Call loadModels() first.');
      }

      try {
        let detectionOptions;
        if (settings.detectorModel === 'ssd_mobilenetv1') {
          detectionOptions = new faceapi.SsdMobilenetv1Options({
            minConfidence: settings.detectionThreshold,
          });
        } else {
          detectionOptions = new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: settings.detectionThreshold,
          });
        }

        let detections: unknown = faceapi
          .detectAllFaces(input, detectionOptions)
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (settings.enableExpressions) {
          detections = (detections as { withFaceExpressions: () => unknown }).withFaceExpressions();
        }

        if (settings.enableAgeGender) {
          detections = (detections as { withAgeAndGender: () => unknown }).withAgeAndGender();
        }

        const results: FaceDetectionResult[] = (await (detections as Promise<unknown>) as FaceApiDetection[]).map((detection) => {
          const result: FaceDetectionResult = {
            detection: {
              box: {
                x: detection.detection.box.x,
                y: detection.detection.box.y,
                width: detection.detection.box.width,
                height: detection.detection.box.height,
              },
              score: detection.detection.score,
            },
          };

          if (detection.landmarks) {
            result.landmarks = {
              positions: detection.landmarks.positions.map((pos) => ({
                x: pos.x,
                y: pos.y,
              })),
              shift: detection.landmarks.shift,
            };
          }

          if (detection.expressions) {
            result.expressions = {
              neutral: detection.expressions.neutral,
              happy: detection.expressions.happy,
              sad: detection.expressions.sad,
              angry: detection.expressions.angry,
              fearful: detection.expressions.fearful,
              disgusted: detection.expressions.disgusted,
              surprised: detection.expressions.surprised,
            };
          }

          if (detection.age && detection.gender) {
            result.ageGender = {
              age: detection.age,
              gender: detection.gender as 'male' | 'female',
              genderProbability: detection.genderProbability ?? 0,
            };
          }

          if (detection.descriptor) {
            result.descriptor = detection.descriptor;
          }

          return result;
        });

        return results;
      } catch (err) {
        console.error('Error detecting faces:', err);
        throw new Error('Face detection failed');
      }
    },
    [modelsLoaded, settings]
  );

  const extractDescriptor = useCallback(
    async (
      input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
    ): Promise<FaceDescriptor | null> => {
      const faces = await detectFaces(input);

      if (faces.length === 0) {
        throw new Error('No face detected in the image');
      }

      if (faces.length > 1) {
        throw new Error('Multiple faces detected. Please ensure only one face is visible.');
      }

      return faces[0].descriptor || null;
    },
    [detectFaces]
  );

  const recognizeFace = useCallback(
    (descriptor: FaceDescriptor, knownPersons: PersonForRecognition[]): FaceMatch | null => {
      const faceapi = faceapiRef.current;

      if (knownPersons.length === 0 || !faceapi) {
        return null;
      }

      let bestMatch: FaceMatch | null = null;
      let minDistance = Infinity;

      for (const person of knownPersons) {
        const personDescriptor = new Float32Array(person.faceDescriptor);

        const distance = faceapi.euclideanDistance(
          descriptor as Float32Array,
          personDescriptor
        );

        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = {
            personId: person.id,
            personName: person.name,
            distance,
            confidence: Math.max(0, 1 - distance),
          };
        }
      }

      if (bestMatch && bestMatch.distance <= settings.recognitionThreshold) {
        return bestMatch;
      }

      return null;
    },
    [settings.recognitionThreshold]
  );

  const updateSettings = useCallback((newSettings: Partial<FaceRecognitionSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));

    if (newSettings.detectorModel) {
      setModelsLoaded(false);
    }
  }, []);

  useEffect(() => {
    const isLoginPage = pathname === '/login' || pathname === '/admin/login';

    if (typeof window !== 'undefined' && !modelsLoaded && !isLoading && !isLoginPage) {
      loadModels();
    }
  }, [loadModels, modelsLoaded, isLoading, pathname]);

  const value: FaceAPIContextType = {
    modelsLoaded,
    isLoading,
    settings,
    error,
    loadModels,
    detectFaces,
    extractDescriptor,
    recognizeFace,
    updateSettings,
  };

  return <FaceAPIContext.Provider value={value}>{children}</FaceAPIContext.Provider>;
}
