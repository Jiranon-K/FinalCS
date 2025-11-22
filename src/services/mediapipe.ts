/* eslint-disable @typescript-eslint/no-explicit-any */
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import type { FaceDetectionResult } from "@/types/face";

let faceDetector: FaceDetector | null = null;
let isInitializing = false;

export async function initMediaPipeFaceDetector(
  minDetectionConfidence: number = 0.5,
): Promise<FaceDetector> {
  if (faceDetector) return faceDetector;
  if (isInitializing) {
    while (isInitializing) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (faceDetector) return faceDetector;
  }

  isInitializing = true;

  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
    );

    faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      minDetectionConfidence,
    });

    console.log("✅ MediaPipe Face Detector initialized successfully");
    return faceDetector;
  } catch (err) {
    console.error("❌ Failed to initialize MediaPipe Face Detector:", err);
    throw err;
  } finally {
    isInitializing = false;
  }
}

export function detectFacesMediaPipe(
  video: HTMLVideoElement,
  timestampMs: number,
): FaceDetectionResult[] {
  if (!faceDetector) {
    throw new Error(
      "MediaPipe Face Detector not initialized. Call initMediaPipeFaceDetector() first.",
    );
  }

  const mpResults = faceDetector.detectForVideo(video, timestampMs);

  if (!mpResults.detections || mpResults.detections.length === 0) {
    return [];
  }

  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  return mpResults.detections.map((detection: any) => {
    const bbox = detection.boundingBox;

    const x = bbox?.originX ?? 0;
    const y = bbox?.originY ?? 0;
    const width = bbox?.width ?? 0;
    const height = bbox?.height ?? 0;

    const score =
      detection.categories && detection.categories.length > 0
        ? detection.categories[0].score
        : 0;

    const keypoints = detection.keypoints || [];
    const landmarkPositions = keypoints.map((kp: { x: number; y: number }) => ({
      x: kp.x * videoWidth,
      y: kp.y * videoHeight,
    }));

    const result: FaceDetectionResult = {
      detection: {
        box: { x, y, width, height },
        score,
      },
    };

    if (landmarkPositions.length > 0) {
      result.landmarks = {
        positions: landmarkPositions,
        shift: { x: 0, y: 0 },
      };
    }

    return result;
  });
}

export function disposeMediaPipeFaceDetector(): void {
  if (faceDetector) {
    faceDetector.close();
    faceDetector = null;
    console.log("MediaPipe Face Detector disposed");
  }
}

export function isMediaPipeReady(): boolean {
  return faceDetector !== null;
}
