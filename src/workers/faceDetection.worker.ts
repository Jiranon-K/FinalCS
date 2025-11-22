import * as faceapi from '@vladmandic/face-api';
import type {
  WorkerMessage,
  WorkerInitPayload,
  WorkerDetectPayload,
  WorkerRecognizePayload,
  DetectionResultPayload,
  RecognitionResultPayload,
} from './faceDetection.types';

let isInitialized = false;
let currentSettings: WorkerInitPayload['settings'] | null = null;

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'INIT':
      await initModels(payload as WorkerInitPayload);
      break;
    case 'DETECT':
      await detectFaces(payload as WorkerDetectPayload);
      break;
    case 'RECOGNIZE':
      recognizeFace(payload as WorkerRecognizePayload);
      break;
  }
};

async function initModels(payload: WorkerInitPayload): Promise<void> {
  const { modelPath, settings } = payload;
  currentSettings = settings;

  try {
    await Promise.all([
      settings.detectorModel === 'ssd_mobilenetv1'
        ? faceapi.nets.ssdMobilenetv1.loadFromUri(modelPath)
        : faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
      faceapi.nets.faceRecognitionNet.loadFromUri(modelPath),
      settings.enableExpressions
        ? faceapi.nets.faceExpressionNet.loadFromUri(modelPath)
        : Promise.resolve(),
      settings.enableAgeGender
        ? faceapi.nets.ageGenderNet.loadFromUri(modelPath)
        : Promise.resolve(),
    ]);

    isInitialized = true;
    
    const response: WorkerMessage = { type: 'INIT_COMPLETE', payload: null };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerMessage = { 
      type: 'INIT_ERROR', 
      payload: { error: error instanceof Error ? error.message : 'Unknown error' } 
    };
    self.postMessage(response);
  }
}

async function detectFaces(payload: WorkerDetectPayload): Promise<void> {
  if (!isInitialized || !currentSettings) {
    return;
  }

  const { imageData, frameId } = payload;

  try {
    const canvas = new OffscreenCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.putImageData(imageData, 0, 0);

    let detectionOptions;
    if (currentSettings.detectorModel === 'ssd_mobilenetv1') {
      detectionOptions = new faceapi.SsdMobilenetv1Options({
        minConfidence: currentSettings.detectionThreshold,
      });
    } else {
      detectionOptions = new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: currentSettings.detectionThreshold,
      });
    }

    const detections = await faceapi
      .detectAllFaces(canvas as unknown as HTMLCanvasElement, detectionOptions)
      .withFaceLandmarks()
      .withFaceDescriptors();

    const faces = detections.map((detection) => ({
      detection: {
        box: {
          x: detection.detection.box.x,
          y: detection.detection.box.y,
          width: detection.detection.box.width,
          height: detection.detection.box.height,
        },
        score: detection.detection.score,
      },
      landmarks: detection.landmarks ? {
        positions: detection.landmarks.positions.map((pos) => ({
          x: pos.x,
          y: pos.y,
        })),
      } : undefined,
      descriptor: detection.descriptor ? Array.from(detection.descriptor) : undefined,
    }));

    const resultPayload: DetectionResultPayload = { frameId, faces };
    const response: WorkerMessage<DetectionResultPayload> = { 
      type: 'DETECTION_RESULT', 
      payload: resultPayload 
    };
    self.postMessage(response);
  } catch (error) {
    console.error('Worker detection error:', error);
  }
}

function recognizeFace(payload: WorkerRecognizePayload): void {
  const { descriptor, knownPersons, recognitionThreshold } = payload;

  let bestMatch: RecognitionResultPayload = {
    personId: null,
    personName: null,
    distance: Infinity,
    confidence: 0,
  };

  const inputDescriptor = new Float32Array(descriptor);

  for (const person of knownPersons) {
    const personDescriptor = new Float32Array(person.faceDescriptor);
    const distance = faceapi.euclideanDistance(inputDescriptor, personDescriptor);

    if (distance < bestMatch.distance) {
      bestMatch = {
        personId: person.id,
        personName: person.name,
        distance,
        confidence: Math.max(0, 1 - distance),
      };
    }
  }

  if (bestMatch.distance > recognitionThreshold) {
    bestMatch = {
      personId: null,
      personName: null,
      distance: bestMatch.distance,
      confidence: 0,
    };
  }

  const response: WorkerMessage<RecognitionResultPayload> = {
    type: 'RECOGNITION_RESULT',
    payload: bestMatch,
  };
  self.postMessage(response);
}

export {};
