'use client';

import { useState } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import FaceUpload from '@/components/register/FaceUpload';

interface FaceUpdateRequestFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function FaceUpdateRequestForm({ onSuccess, onCancel }: FaceUpdateRequestFormProps) {
  const { t } = useLocale();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [faceImagePreview, setFaceImagePreview] = useState<string | null>(null);

  const handleFaceDetected = (imageFile: File, descriptors: number[][], mainImage: string) => {
    if (descriptors.length > 0) {
      setFaceDescriptor(descriptors[0]);
    }
    setFaceImagePreview(mainImage);
  };

  const handleImageRemove = () => {
    setFaceDescriptor(null);
    setFaceImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!faceDescriptor || !faceImagePreview) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/face-update-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          faceDescriptor,
          imageData: faceImagePreview,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast({ message: t.profile.requestSubmitted, type: 'success' });
        onSuccess();
      } else {
        throw new Error(result.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      showToast({ 
        message: error instanceof Error ? error.message : t.toasts.operationError, 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl border border-base-200">
      <div className="card-body">
        <h3 className="card-title text-lg mb-4">{t.profile.submitNewFace}</h3>
        
        <FaceUpload
          onFaceDetected={handleFaceDetected}
          onImageRemove={handleImageRemove}
          currentImage={faceImagePreview}
        />

        <div className="card-actions justify-end mt-6">
          <button 
            className="btn btn-ghost" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t.register.cancel}
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!faceDescriptor || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {t.register.submitting}
              </>
            ) : (
              t.profile.submitRequest
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
