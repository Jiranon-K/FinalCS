'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faCheckCircle, faExclamationTriangle, faTrash } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import * as faceapi from 'face-api.js';

interface FaceUploadProps {
  onFaceDetected: (imageFile: File, faceDescriptor: number[]) => void;
  onImageRemove: () => void;
  currentImage: string | null;
}

export default function FaceUpload({
  onFaceDetected,
  onImageRemove,
  currentImage,
}: FaceUploadProps) {
  const { t } = useLocale();
  const [isDetecting, setIsDetecting] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/model';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (error) {
        console.error('Error loading face detection models:', error);
        setDetectionError(t.faceDetection.loadingModels + ' failed');
      }
    };

    loadModels();
  }, [t]);

  const detectFace = async (file: File) => {
    if (!modelsLoaded) {
      setDetectionError(t.faceDetection.loadingModels);
      return;
    }

    setIsDetecting(true);
    setDetectionError(null);
    setFaceDetected(false);
    setConfidence(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: file.type });
      const img = await faceapi.bufferToImage(blob);

      const detections = await faceapi
        .detectAllFaces(img)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        setDetectionError(t.faceDetection.noFaceDetected);
        return;
      }

      if (detections.length > 1) {
        setDetectionError(t.faceDetection.multipleFacesDetected);
        return;
      }

      const detection = detections[0];
      const faceConfidence = detection.detection.score;

      setFaceDetected(true);
      setConfidence(faceConfidence);

      const descriptor = Array.from(detection.descriptor);
      onFaceDetected(file, descriptor);

    } catch (error) {
      console.error('Face detection error:', error);
      setDetectionError(t.faceDetection.noFaceDetected);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setDetectionError(t.register.invalidFileType);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setDetectionError(t.register.fileTooLarge);
      return;
    }

    await detectFace(file);
  };

  const handleRemove = () => {
    setFaceDetected(false);
    setDetectionError(null);
    setConfidence(null);
    onImageRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-base-300 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
        {currentImage ? (
          <div className="relative w-full h-full">
            <Image
              src={currentImage}
              alt="Face preview"
              fill
              className="object-contain"
            />
            {faceDetected && (
              <div className="absolute top-4 right-4">
                <div className="badge badge-success gap-2">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  {t.register.faceDetected}
                  {confidence && ` (${(confidence * 100).toFixed(1)}%)`}
                </div>
              </div>
            )}
            {detectionError && (
              <div className="absolute top-4 right-4">
                <div className="badge badge-error gap-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  {detectionError}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-base-content/50 p-8">
            <FontAwesomeIcon icon={faUpload} size="3x" className="mb-4 opacity-30" />
            <p>{t.register.selectImage}</p>
          </div>
        )}

        {isDetecting && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-white mt-4">{t.register.detectingFace}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <label className="btn btn-primary">
          <FontAwesomeIcon icon={faUpload} />
          {currentImage ? t.register.uploadImage : t.register.uploadImage}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {currentImage && (
          <button
            type="button"
            onClick={handleRemove}
            className="btn btn-outline btn-error"
          >
            <FontAwesomeIcon icon={faTrash} />
            {t.register.retakePhoto}
          </button>
        )}
      </div>

      {!currentImage && !isDetecting && (
        <div className="alert alert-info">
          <FontAwesomeIcon icon={faUpload} />
          <span>{t.register.faceImageInfo}</span>
        </div>
      )}

      {detectionError && !isDetecting && (
        <div className="alert alert-error">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <span>{detectionError}</span>
        </div>
      )}

      {!modelsLoaded && (
        <div className="alert alert-warning">
          <span className="loading loading-spinner"></span>
          <span>{t.faceDetection.loadingModels}</span>
        </div>
      )}
    </div>
  );
}
